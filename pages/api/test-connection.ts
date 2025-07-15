import { NextApiRequest, NextApiResponse } from 'next';
import { sourceDb, targetDb } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const results = {
    source: { 
      connected: false, 
      error: null as string | null,
      server: null as string | null,
      database: null as string | null
    },
    target: { 
      connected: false, 
      error: null as string | null,
      server: null as string | null,
      database: null as string | null
    }
  };

  try {
    // Test source database
    try {
      if (sourceDb) {
        const connectionInfo = sourceDb.getConnectionInfo();
        results.source.server = connectionInfo.server;
        results.source.database = connectionInfo.database;
        results.source.connected = await sourceDb.testConnection();
        if (!results.source.connected) {
          results.source.error = 'Connection test failed';
        }
      } else {
        results.source.error = 'Source database configuration not found';
      }
    } catch (error) {
      results.source.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test target database
    try {
      if (targetDb) {
        const connectionInfo = targetDb.getConnectionInfo();
        results.target.server = connectionInfo.server;
        results.target.database = connectionInfo.database;
        results.target.connected = await targetDb.testConnection();
        if (!results.target.connected) {
          results.target.error = 'Connection test failed';
        }
      } else {
        results.target.error = 'Target database configuration not found';
      }
    } catch (error) {
      results.target.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const bothConnected = results.source.connected && results.target.connected;

    res.status(200).json({
      success: bothConnected,
      message: bothConnected ? 'All connections successful' : 'Some connections failed',
      results,
      env: {
        hasSourceConnection: !!process.env.SOURCE_DB_HOST || !!process.env.SOURCE_DB_FILENAME,
        hasTargetConnection: !!process.env.TARGET_DB_HOST || !!process.env.TARGET_DB_FILENAME,
        dbType: process.env.DB_TYPE || 'not configured',
      }
    });
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test connections',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    });
  }
}