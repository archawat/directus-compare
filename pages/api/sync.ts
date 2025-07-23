import { NextApiRequest, NextApiResponse } from 'next';
import { getSourceDb, getTargetDb } from '../../lib/database';
import { PermissionComparator, PermissionDiff } from '../../lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { diffs, flipped }: { diffs: PermissionDiff[], flipped?: boolean } = req.body;
    const sourceDb = getSourceDb(flipped);
    const targetDb = getTargetDb(flipped);
    
    if (!sourceDb || !targetDb) {
      return res.status(400).json({
        success: false,
        message: 'Database connections not configured. Please check your environment variables.'
      });
    }
    
    if (!diffs || !Array.isArray(diffs)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request body. Expected array of diffs.' 
      });
    }

    const comparator = new PermissionComparator(sourceDb, targetDb, flipped);
    const results = [];

    for (const diff of diffs) {
      try {
        await comparator.syncPermission(diff);
        results.push({
          key: diff.key,
          success: true,
          message: `Successfully synced ${diff.collection}:${diff.action} for policy ${diff.policy_name}`
        });
      } catch (error) {
        results.push({
          key: diff.key,
          success: false,
          message: `Failed to sync ${diff.collection}:${diff.action} for policy ${diff.policy_name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: failureCount === 0,
      message: `Sync completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}