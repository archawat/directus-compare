import { NextApiRequest, NextApiResponse } from 'next';
import { getSourceDb, getTargetDb } from '../../lib/database';
import { PermissionComparator } from '../../lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const flipped = req.query.flipped === 'true';
    const sourceDb = getSourceDb(flipped);
    const targetDb = getTargetDb(flipped);
    
    if (!sourceDb || !targetDb) {
      return res.status(400).json({
        success: false,
        message: 'Database connections not configured. Please check your environment variables.'
      });
    }

    const comparator = new PermissionComparator(sourceDb, targetDb, flipped);
    const diffs = await comparator.comparePermissions();
    
    res.status(200).json({
      success: true,
      data: diffs,
      summary: {
        total: diffs.length,
        added: diffs.filter(d => d.status === 'added').length,
        removed: diffs.filter(d => d.status === 'removed').length,
        modified: diffs.filter(d => d.status === 'modified').length,
        identical: diffs.filter(d => d.status === 'identical').length,
      }
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compare permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}