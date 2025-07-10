import sql from 'mssql';

export class DatabaseConnection {
  private pool: sql.ConnectionPool | null = null;
  private config: sql.config;
  private isConnecting = false;

  constructor(connectionString: string) {
    this.config = this.parseConnectionString(connectionString);
  }

  private parseConnectionString(connectionString: string): sql.config {
    if (!connectionString || typeof connectionString !== 'string') {
      throw new Error(`Invalid connection string: ${connectionString}`);
    }

    const params = new Map<string, string>();
    
    // Parse connection string parameters
    connectionString.split(';').forEach(part => {
      const trimmedPart = part.trim();
      if (trimmedPart) {
        const equalIndex = trimmedPart.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedPart.substring(0, equalIndex).trim().toLowerCase();
          const value = trimmedPart.substring(equalIndex + 1).trim();
          if (key && value) {
            params.set(key, value);
          }
        }
      }
    });

    const server = params.get('server') || params.get('data source') || params.get('host');
    const database = params.get('database') || params.get('initial catalog');
    const user = params.get('user id') || params.get('uid') || params.get('username');
    const password = params.get('password') || params.get('pwd');

    if (!server || typeof server !== 'string') {
      throw new Error(`Server/Data Source not found or invalid in connection string. Available keys: ${Array.from(params.keys()).join(', ')}`);
    }

    const config: sql.config = {
      server: server,
      database: database || '',
      user: user || '',
      password: password || '',
      options: {
        encrypt: params.get('encrypt') === 'true',
        trustServerCertificate: params.get('trustservercertificate') === 'true' || true,
        enableArithAbort: true,
      },
    };

    // Handle integrated security
    if (params.get('integrated security') === 'true' || params.get('trusted_connection') === 'true') {
      delete config.user;
      delete config.password;
    }

    return config;
  }

  async connect(): Promise<void> {
    if (this.pool && this.pool.connected) {
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
      if (this.pool) {
        await this.pool.close();
      }
      this.pool = new sql.ConnectionPool(this.config);
      await this.pool.connect();
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  getConnectionInfo() {
    return {
      server: this.config.server,
      database: this.config.database,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.query('SELECT 1 as test');
      return result.recordset.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async query(queryText: string, params?: any[]): Promise<sql.IResult<any>> {
    await this.connect();
    
    if (!this.pool || !this.pool.connected) {
      throw new Error('Database connection is not available');
    }
    
    const request = this.pool.request();
    
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    
    return await request.query(queryText);
  }
}

// Create database connections only if environment variables are set
let sourceDb: DatabaseConnection | null = null;
let targetDb: DatabaseConnection | null = null;

try {
  if (process.env.SOURCE_DB_CONNECTION_STRING) {
    sourceDb = new DatabaseConnection(process.env.SOURCE_DB_CONNECTION_STRING);
  }
} catch (error) {
  console.error('Error creating source database connection:', error);
  sourceDb = null;
}

try {
  if (process.env.TARGET_DB_CONNECTION_STRING) {
    targetDb = new DatabaseConnection(process.env.TARGET_DB_CONNECTION_STRING);
  }
} catch (error) {
  console.error('Error creating target database connection:', error);
  targetDb = null;
}

export { sourceDb, targetDb };