import React from 'react';
import { PermissionDiff } from '../lib/permissions';

interface PermissionsListProps {
  diffs: PermissionDiff[];
  selectedDiffs: string[];
  onDiffSelect: (key: string, selected: boolean) => void;
  onViewDiff: (diff: PermissionDiff) => void;
}

const PermissionsList: React.FC<PermissionsListProps> = ({
  diffs,
  selectedDiffs,
  onDiffSelect,
  onViewDiff,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
        return '➕';
      case 'removed':
        return '➖';
      case 'modified':
        return '🔄';
      case 'identical':
        return '✅';
      default:
        return '❓';
    }
  };

  const normalizeFields = (fieldsString: string | null): string | null => {
    if (!fieldsString) return fieldsString;
    return fieldsString
      .split(',')
      .map(field => field.trim())
      .filter(field => field.length > 0)
      .sort()
      .join(', '); // Use ', ' for display (with space)
  };

  const formatPermissionSummary = (permission: any) => {
    if (!permission) return 'None';
    
    const parts = [];
    if (permission.permissions) parts.push(`Permissions: ${permission.permissions}`);
    if (permission.validation) parts.push(`Validation: ${permission.validation}`);
    if (permission.presets) parts.push(`Presets: ${permission.presets}`);
    if (permission.fields) {
      const normalizedFields = normalizeFields(permission.fields);
      parts.push(`Fields: ${normalizedFields}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No specific permissions';
  };

  const analyzeFieldChanges = (diff: PermissionDiff) => {
    if (diff.status === 'identical' || !diff.sourcePermission || !diff.targetPermission) {
      return { added: [], removed: [] };
    }

    const sourceFields = normalizeFields(diff.sourcePermission.fields)?.split(',').filter(f => f) || [];
    const targetFields = normalizeFields(diff.targetPermission.fields)?.split(',').filter(f => f) || [];

    const added = sourceFields.filter(field => !targetFields.includes(field));
    const removed = targetFields.filter(field => !sourceFields.includes(field));

    return { added, removed };
  };

  const formatFieldChanges = (fields: string[]) => {
    if (fields.length === 0) return '-';
    if (fields.length <= 3) return fields.join(', ');
    return `${fields.slice(0, 2).join(', ')}, +${fields.length - 2} more`;
  };

  const getActionBadgeClass = (action: string) => {
    switch (action.toLowerCase()) {
      case 'read':
        return 'action-read';
      case 'create':
        return 'action-create';
      case 'update':
        return 'action-update';
      case 'delete':
        return 'action-delete';
      default:
        return 'action-default';
    }
  };

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Permissions Comparison</h2>
        <p className="text-sm text-gray-600 mt-1">
          {diffs.length} permissions found
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={(() => {
                    const selectableDiffs = diffs.filter(d => d.status !== 'identical');
                    const selectedSelectableDiffs = selectableDiffs.filter(d => selectedDiffs.includes(d.key));
                    return selectableDiffs.length > 0 && selectedSelectableDiffs.length === selectableDiffs.length;
                  })()}
                  onChange={(e) => {
                    const nonIdenticalDiffs = diffs.filter(d => d.status !== 'identical');
                    nonIdenticalDiffs.forEach(diff => {
                      onDiffSelect(diff.key, e.target.checked);
                    });
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policy
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collection
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fields Added
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fields Removed
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {diffs.map((diff) => (
              <tr key={diff.key} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedDiffs.includes(diff.key)}
                    onChange={(e) => onDiffSelect(diff.key, e.target.checked)}
                    disabled={diff.status === 'identical'}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2">{getStatusIcon(diff.status)}</span>
                    <span className={`status-badge status-${diff.status}`}>
                      {diff.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{diff.policy_name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-32" title={diff.policy}>
                      {diff.policy}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {diff.collection}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`action-badge ${getActionBadgeClass(diff.action)}`}>
                    {diff.action.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={formatPermissionSummary(diff.sourcePermission)}>
                    {formatPermissionSummary(diff.sourcePermission)}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={formatPermissionSummary(diff.targetPermission)}>
                    {formatPermissionSummary(diff.targetPermission)}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 max-w-32">
                  {(() => {
                    const fieldChanges = analyzeFieldChanges(diff);
                    return fieldChanges.added.length > 0 ? (
                      <div className="text-green-700" title={fieldChanges.added.join(', ')}>
                        <span className="inline-flex items-center">
                          ➕ {formatFieldChanges(fieldChanges.added)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    );
                  })()}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 max-w-32">
                  {(() => {
                    const fieldChanges = analyzeFieldChanges(diff);
                    return fieldChanges.removed.length > 0 ? (
                      <div className="text-red-700" title={fieldChanges.removed.join(', ')}>
                        <span className="inline-flex items-center">
                          ➖ {formatFieldChanges(fieldChanges.removed)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    );
                  })()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewDiff(diff)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Diff
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {diffs.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No permissions found. Click "Compare Permissions" to start.
        </div>
      )}
    </div>
  );
};

export default PermissionsList;