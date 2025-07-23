import { DatabaseConnection } from './database';

export interface Permission {
  id: number;
  policy: string;
  policy_name: string;
  collection: string;
  action: string;
  permissions: string | null;
  validation: string | null;
  presets: string | null;
  fields: string | null;
}

export interface PermissionDiff {
  key: string;
  collection: string;
  action: string;
  policy: string;
  policy_name: string;
  sourcePermission: Permission | null;
  targetPermission: Permission | null;
  status: 'added' | 'removed' | 'modified' | 'identical';
}

export class PermissionComparator {
  private sourceDb: DatabaseConnection;
  private targetDb: DatabaseConnection;
  private flipped: boolean;

  constructor(sourceDb: DatabaseConnection, targetDb: DatabaseConnection, flipped = false) {
    this.sourceDb = sourceDb;
    this.targetDb = targetDb;
    this.flipped = flipped;
  }

  private getActualSourceDb(): DatabaseConnection {
    return this.flipped ? this.targetDb : this.sourceDb;
  }

  private getActualTargetDb(): DatabaseConnection {
    return this.flipped ? this.sourceDb : this.targetDb;
  }

  async getPermissions(db: DatabaseConnection): Promise<Permission[]> {
    const query = `
      SELECT 
        p.id,
        p.policy,
        pol.name as policy_name,
        p.collection,
        p.action,
        p.permissions,
        p.validation,
        p.presets,
        p.fields
      FROM directus_permissions p
      LEFT JOIN directus_policies pol ON p.policy = pol.id
      ORDER BY p.collection, p.action, pol.name
    `;
    
    const result = await db.query(query);
    
    // Handle different result structures from different database drivers
    if (result.recordset) {
      // MSSQL returns recordset
      return result.recordset;
    } else if (result.rows) {
      // PostgreSQL returns rows
      return result.rows;
    } else if (Array.isArray(result)) {
      // MySQL/SQLite return array directly
      return result;
    } else {
      // Handle other cases
      return result;
    }
  }

  private createPermissionKey(permission: Permission): string {
    return `${permission.collection}:${permission.action}:${permission.policy}`;
  }

  private normalizeFields(fieldsString: string | null): string | null {
    if (!fieldsString) return fieldsString;
    
    // Split, trim, filter empty, sort, and rejoin
    return fieldsString
      .split(',')
      .map(field => field.trim())
      .filter(field => field.length > 0)
      .sort()
      .join(',');
  }

  private comparePermissionData(source: Permission, target: Permission): boolean {
    // Normalize fields before comparison
    const sourceFields = this.normalizeFields(source.fields);
    const targetFields = this.normalizeFields(target.fields);
    
    return (
      source.permissions === target.permissions &&
      source.validation === target.validation &&
      source.presets === target.presets &&
      sourceFields === targetFields
    );
  }

  async comparePermissions(): Promise<PermissionDiff[]> {
    const sourcePermissions = await this.getPermissions(this.getActualSourceDb());
    const targetPermissions = await this.getPermissions(this.getActualTargetDb());

    // Get policies that exist in both servers
    const sourcePolicies = new Set(sourcePermissions.map(p => p.policy));
    const targetPolicies = new Set(targetPermissions.map(p => p.policy));
    const commonPolicies = new Set([...sourcePolicies].filter(p => targetPolicies.has(p)));

    // Filter permissions to only include those with policies that exist in both servers
    const filteredSourcePermissions = sourcePermissions.filter(p => commonPolicies.has(p.policy));
    const filteredTargetPermissions = targetPermissions.filter(p => commonPolicies.has(p.policy));

    const sourceMap = new Map<string, Permission>();
    const targetMap = new Map<string, Permission>();

    filteredSourcePermissions.forEach(perm => {
      sourceMap.set(this.createPermissionKey(perm), perm);
    });

    filteredTargetPermissions.forEach(perm => {
      targetMap.set(this.createPermissionKey(perm), perm);
    });

    const allKeys = new Set([...Array.from(sourceMap.keys()), ...Array.from(targetMap.keys())]);
    const diffs: PermissionDiff[] = [];

    for (const key of Array.from(allKeys)) {
      const sourcePermission = sourceMap.get(key) || null;
      const targetPermission = targetMap.get(key) || null;

      let status: PermissionDiff['status'];
      
      if (sourcePermission && !targetPermission) {
        status = 'added';
      } else if (!sourcePermission && targetPermission) {
        status = 'removed';
      } else if (sourcePermission && targetPermission) {
        status = this.comparePermissionData(sourcePermission, targetPermission) ? 'identical' : 'modified';
      } else {
        continue;
      }

      const [collection, action, policy] = key.split(':');
      
      // Get policy name from either source or target permission
      const policy_name = sourcePermission?.policy_name || targetPermission?.policy_name || 'Unknown Policy';
      
      diffs.push({
        key,
        collection,
        action,
        policy,
        policy_name,
        sourcePermission,
        targetPermission,
        status
      });
    }

    return diffs.sort((a, b) => {
      // Sort by policy first
      if (a.policy_name !== b.policy_name) return a.policy_name.localeCompare(b.policy_name);
      
      // Then by collection
      if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
      
      // Then by action in specific order: read, create, update, delete
      const actionOrder = ['read', 'create', 'update', 'delete'];
      const aIndex = actionOrder.indexOf(a.action.toLowerCase());
      const bIndex = actionOrder.indexOf(b.action.toLowerCase());
      
      // If both actions are in the order list, sort by index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one action is in the order list, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither action is in the order list, sort alphabetically
      return a.action.localeCompare(b.action);
    });
  }

  async syncPermission(diff: PermissionDiff): Promise<void> {
    // When flipped, we need to reverse the logic because:
    // - diff.sourcePermission comes from what's now the target DB
    // - diff.targetPermission comes from what's now the source DB
    // - But sync should still go from actual source TO actual target
    
    if (this.flipped) {
      // In flipped mode, reverse the sync logic
      if (!diff.targetPermission) {
        // No permission in actual source (was target), so delete from actual target (was source)
        await this.deletePermission(diff.sourcePermission!);
      } else if (!diff.sourcePermission) {
        // No permission in actual target (was source), so create in actual target from actual source
        await this.createPermission(diff.targetPermission);
      } else {
        // Both exist, update actual target with actual source data
        await this.updatePermission(diff.targetPermission, diff.sourcePermission.id);
      }
    } else {
      // Normal mode - original logic
      if (!diff.sourcePermission) {
        await this.deletePermission(diff.targetPermission!);
      } else if (!diff.targetPermission) {
        await this.createPermission(diff.sourcePermission);
      } else {
        await this.updatePermission(diff.sourcePermission, diff.targetPermission.id);
      }
    }
  }

  private async createPermission(permission: Permission): Promise<void> {
    const query = `
      INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Normalize fields before storing
    const normalizedFields = this.normalizeFields(permission.fields);
    
    await this.getActualTargetDb().query(query, [
      permission.policy,
      permission.collection,
      permission.action,
      permission.permissions,
      permission.validation,
      permission.presets,
      normalizedFields
    ]);
  }

  private async updatePermission(sourcePermission: Permission, targetId: number): Promise<void> {
    const query = `
      UPDATE directus_permissions 
      SET permissions = ?, validation = ?, presets = ?, fields = ?
      WHERE id = ?
    `;
    
    // Normalize fields before storing
    const normalizedFields = this.normalizeFields(sourcePermission.fields);
    
    await this.getActualTargetDb().query(query, [
      sourcePermission.permissions,
      sourcePermission.validation,
      sourcePermission.presets,
      normalizedFields,
      targetId
    ]);
  }

  private async deletePermission(permission: Permission): Promise<void> {
    const query = `DELETE FROM directus_permissions WHERE id = ?`;
    await this.getActualTargetDb().query(query, [permission.id]);
  }
}