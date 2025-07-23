import { Knex, knex } from 'knex';

export interface DatabaseConfig {
  type: 'mssql' | 'mysql' | 'pg' | 'sqlite3';
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  filename?: string;
}

export class DatabaseConnection {
  private knexInstance: Knex | null = null;
  private config: DatabaseConfig;
  private isConnecting = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  private createKnexConfig(): Knex.Config {
    const baseConfig: Knex.Config = {
      client: this.config.type,
    };

    switch (this.config.type) {
      case 'mssql':
        baseConfig.connection = {
          server: this.config.host!,
          port: this.config.port || 1433,
          database: this.config.database!,
          user: this.config.user!,
          password: this.config.password!,
          options: {
            encrypt: this.config.ssl || false,
            trustServerCertificate: true,
            enableArithAbort: true,
          },
        };
        break;
      
      case 'mysql':
        baseConfig.connection = {
          host: this.config.host!,
          port: this.config.port || 3306,
          database: this.config.database!,
          user: this.config.user!,
          password: this.config.password!,
          ssl: this.config.ssl ? {} : false,
        };
        break;
      
      case 'pg':
        baseConfig.connection = {
          host: this.config.host!,
          port: this.config.port || 5432,
          database: this.config.database!,
          user: this.config.user!,
          password: this.config.password!,
          ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        };
        break;
      
      case 'sqlite3':
        baseConfig.connection = {
          filename: this.config.filename!,
        };
        baseConfig.useNullAsDefault = true;
        break;
      
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }

    return baseConfig;
  }

  async connect(): Promise<void> {
    if (this.knexInstance) {
      return;
    }
    
    if (this.isConnecting) {
      // Wait for existing connection attempt
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isConnecting = true;
    try {
      const knexConfig = this.createKnexConfig();
      this.knexInstance = knex(knexConfig);
      
      // Test the connection
      await this.knexInstance.raw('SELECT 1');
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.knexInstance) {
      await this.knexInstance.destroy();
      this.knexInstance = null;
    }
  }

  getConnectionInfo() {
    return {
      server: this.config.host || this.config.filename || 'unknown',
      database: this.config.database || this.config.filename || 'unknown',
      type: this.config.type,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const testQuery = this.config.type === 'mssql' ? 'SELECT 1 as test' : 'SELECT 1';
      const result = await this.knexInstance!.raw(testQuery);
      return result && result.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async query(queryText: string, params?: any[]): Promise<any> {
    await this.connect();
    
    if (!this.knexInstance) {
      throw new Error('Database connection is not available');
    }
    
    if (params && params.length > 0) {
      return await this.knexInstance.raw(queryText, params);
    } else {
      return await this.knexInstance.raw(queryText);
    }
  }

  getKnexInstance(): Knex {
    if (!this.knexInstance) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.knexInstance;
  }
}

function createDatabaseConfig(prefix: 'SOURCE' | 'TARGET'): DatabaseConfig | null {
  const dbType = process.env.DB_TYPE as DatabaseConfig['type'];
  
  if (!dbType) {
    console.error('DB_TYPE environment variable is required');
    return null;
  }

  if (dbType === 'sqlite3') {
    const filename = process.env[`${prefix}_DB_FILENAME`];
    if (!filename) {
      console.error(`${prefix}_DB_FILENAME is required for SQLite`);
      return null;
    }
    return {
      type: 'sqlite3',
      filename,
    };
  }

  const host = process.env[`${prefix}_DB_HOST`];
  const database = process.env[`${prefix}_DB_NAME`];
  const user = process.env[`${prefix}_DB_USER`];
  const password = process.env[`${prefix}_DB_PASSWORD`];
  const portStr = process.env[`${prefix}_DB_PORT`];
  const sslStr = process.env[`${prefix}_DB_SSL`];

  if (!host || !database || !user || !password) {
    console.error(`Missing required environment variables for ${prefix} database`);
    return null;
  }

  return {
    type: dbType,
    host,
    port: portStr ? parseInt(portStr, 10) : undefined,
    database,
    user,
    password,
    ssl: sslStr === 'true',
  };
}

// Create database connections only if environment variables are set
let sourceDb: DatabaseConnection | null = null;
let targetDb: DatabaseConnection | null = null;

try {
  const sourceConfig = createDatabaseConfig('SOURCE');
  if (sourceConfig) {
    sourceDb = new DatabaseConnection(sourceConfig);
  }
} catch (error) {
  console.error('Error creating source database connection:', error);
  sourceDb = null;
}

try {
  const targetConfig = createDatabaseConfig('TARGET');
  if (targetConfig) {
    targetDb = new DatabaseConnection(targetConfig);
  }
} catch (error) {
  console.error('Error creating target database connection:', error);
  targetDb = null;
}

export { sourceDb, targetDb };

export function getSourceDb(flipped = false): DatabaseConnection | null {
  return flipped ? targetDb : sourceDb;
}

export function getTargetDb(flipped = false): DatabaseConnection | null {
  return flipped ? sourceDb : targetDb;
}

export function getConnectionInfo(flipped = false) {
  const source = getSourceDb(flipped);
  const target = getTargetDb(flipped);
  
  return {
    source: source ? source.getConnectionInfo() : null,
    target: target ? target.getConnectionInfo() : null,
  };
}