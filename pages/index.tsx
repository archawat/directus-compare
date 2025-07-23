import { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { PermissionDiff } from '../lib/permissions';
import DiffViewer from '../components/DiffViewer';
import SummaryCard from '../components/SummaryCard';
import PermissionsList from '../components/PermissionsList';

interface ComparisonSummary {
  total: number;
  added: number;
  removed: number;
  modified: number;
  identical: number;
}

interface ComparisonResult {
  success: boolean;
  data: PermissionDiff[];
  summary: ComparisonSummary;
  message?: string;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  results: {
    source: { 
      connected: boolean; 
      error: string | null;
      server: string | null;
      database: string | null;
    };
    target: { 
      connected: boolean; 
      error: string | null;
      server: string | null;
      database: string | null;
    };
  };
  env: {
    hasSourceConnection: boolean;
    hasTargetConnection: boolean;
  };
}

export default function Home() {
  const [diffs, setDiffs] = useState<PermissionDiff[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedDiffs, setSelectedDiffs] = useState<string[]>([]);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<PermissionDiff | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [statusFilters, setStatusFilters] = useState({
    added: true,
    removed: false,
    modified: true,
    identical: false
  });
  const [selectedPolicy, setSelectedPolicy] = useState<string>('all');
  const [sidesFlipped, setSidesFlipped] = useState(false);

  const testConnections = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch(`/api/test-connection?flipped=${sidesFlipped}`);
      const result: ConnectionTestResult = await response.json();
      setConnectionStatus(result);
      
      if (!result.success) {
        toast.error(`Connection test failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to test connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(false);
    }
  };


  const fetchComparison = async () => {
    if (!connectionStatus?.success) {
      toast.error('Please test database connections first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/compare?flipped=${sidesFlipped}`);
      const result: ComparisonResult = await response.json();
      
      if (result.success) {
        setDiffs(result.data);
        setSummary(result.summary);
        toast.success(`Comparison completed! Found ${result.summary.total} permissions`);
      } else {
        toast.error(`Comparison failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to fetch comparison: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSides = () => {
    setSidesFlipped(!sidesFlipped);
    setSelectedDiffs([]);
    setDiffs([]);
    setSummary(null);
    setConnectionStatus(null);
  };

  const syncPermissions = async () => {
    // Only sync items that are both filtered (visible) AND selected (checked)
    const diffsToSync = filteredDiffs.filter(d => selectedDiffs.includes(d.key));
    if (diffsToSync.length === 0) {
      toast.error('Please select permissions to sync');
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diffs: diffsToSync, flipped: sidesFlipped }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`🎉 Sync completed! ${result.summary.successful} permissions synced successfully`, {
          duration: 4000,
        });
        if (result.summary.failed > 0) {
          toast.error(`⚠️ ${result.summary.failed} permissions failed to sync`);
        }
        setSelectedDiffs([]);
        await fetchComparison();
      } else {
        toast.error(`Sync failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to sync permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDiffSelect = (key: string, selected: boolean) => {
    if (selected) {
      setSelectedDiffs(prev => [...prev, key]);
    } else {
      setSelectedDiffs(prev => prev.filter(k => k !== key));
    }
  };

  // Get unique policies for filter dropdown
  const availablePolicies = Array.from(
    new Set(diffs.map(diff => diff.policy_name).filter(name => name && name !== 'Unknown Policy'))
  ).sort();

  // First apply policy filter
  const policyFilteredDiffs = diffs.filter(diff => 
    selectedPolicy === 'all' || diff.policy_name === selectedPolicy
  );

  // Compute status counts from policy-filtered results
  const policyFilteredSummary = {
    total: policyFilteredDiffs.length,
    added: policyFilteredDiffs.filter(d => d.status === 'added').length,
    removed: policyFilteredDiffs.filter(d => d.status === 'removed').length,
    modified: policyFilteredDiffs.filter(d => d.status === 'modified').length,
    identical: policyFilteredDiffs.filter(d => d.status === 'identical').length,
  };

  // Then apply both policy and status filters
  const filteredDiffs = policyFilteredDiffs.filter(diff => statusFilters[diff.status]);

  const handleStatusFilterChange = (status: 'added' | 'removed' | 'modified' | 'identical') => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
    
    // Clear selections for items that will be hidden by the new filter
    const newFilters = { ...statusFilters, [status]: !statusFilters[status] };
    const newFilteredKeys = diffs.filter(diff => {
      const statusMatch = newFilters[diff.status];
      const policyMatch = selectedPolicy === 'all' || diff.policy_name === selectedPolicy;
      return statusMatch && policyMatch;
    }).map(d => d.key);
    setSelectedDiffs(prev => prev.filter(key => newFilteredKeys.includes(key)));
  };

  const handleSelectAll = () => {
    const selectableDiffs = filteredDiffs.filter(d => d.status !== 'identical');
    setSelectedDiffs(selectableDiffs.map(d => d.key));
  };

  const handleDeselectAll = () => {
    setSelectedDiffs([]);
  };

  const handlePolicyFilterChange = (policy: string) => {
    setSelectedPolicy(policy);
    
    // Clear selections for items that will be hidden by the new policy filter
    const newFilteredKeys = diffs.filter(diff => {
      const statusMatch = statusFilters[diff.status];
      const policyMatch = policy === 'all' || diff.policy_name === policy;
      return statusMatch && policyMatch;
    }).map(d => d.key);
    setSelectedDiffs(prev => prev.filter(key => newFilteredKeys.includes(key)));
  };

  const handleViewDiff = (diff: PermissionDiff) => {
    setSelectedDiff(diff);
    setShowDiffViewer(true);
  };

  useEffect(() => {
    testConnections();
  }, [sidesFlipped]);

  return (
    <>
      <Head>
        <title>Directus Compare Tool</title>
        <meta name="description" content="Compare and sync Directus instances" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Directus Compare Tool</h1>
            <p className="text-gray-600">Compare and sync permissions between Directus instances</p>
          </div>

          <div className="mb-6">
            <button
              onClick={testConnections}
              disabled={testingConnection}
              className="btn btn-secondary mr-4"
            >
              {testingConnection ? 'Testing...' : 'Test Connections'}
            </button>
            
            <button
              onClick={fetchComparison}
              disabled={loading || !connectionStatus?.success}
              className="btn btn-primary mr-4"
            >
              {loading ? 'Loading...' : 'Compare Permissions'}
            </button>
            
            {diffs.length > 0 && (
              <>
                <button
                  onClick={syncPermissions}
                  disabled={syncing || selectedDiffs.length === 0}
                  className="btn btn-success mr-4"
                >
                  {syncing ? 'Syncing...' : `Sync Selected (${filteredDiffs.filter(d => selectedDiffs.includes(d.key)).length})`}
                </button>
                
                <button
                  onClick={handleSelectAll}
                  className="btn btn-secondary mr-2"
                >
                  Select All Visible
                </button>
                
                <button
                  onClick={handleDeselectAll}
                  className="btn btn-secondary"
                >
                  Deselect All
                </button>
              </>
            )}
          </div>

          {connectionStatus && (
            <div className="card p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center flex-1">
                  <span className={`mr-2 ${connectionStatus.results.source.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {connectionStatus.results.source.connected ? '✅' : '❌'}
                  </span>
                  <span className="font-medium mr-2">Source:</span>
                  {connectionStatus.results.source.server && connectionStatus.results.source.database ? (
                    <span className="text-gray-700">
                      {connectionStatus.results.source.server} / {connectionStatus.results.source.database}
                    </span>
                  ) : (
                    <span className="text-red-600">
                      {connectionStatus.results.source.error || 'Not configured'}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-center px-4">
                  <button
                    onClick={toggleSides}
                    className={`btn ${sidesFlipped ? 'btn-warning' : 'btn-info'} flex items-center px-3 py-2`}
                    title="Click to toggle direction"
                  >
                    <span className="text-lg">⇄</span>
                  </button>
                </div>
                
                <div className="flex items-center flex-1 justify-end">
                  <span className="font-medium mr-2">Target:</span>
                  {connectionStatus.results.target.server && connectionStatus.results.target.database ? (
                    <span className="text-gray-700">
                      {connectionStatus.results.target.server} / {connectionStatus.results.target.database}
                    </span>
                  ) : (
                    <span className="text-red-600">
                      {connectionStatus.results.target.error || 'Not configured'}
                    </span>
                  )}
                  <span className={`ml-2 ${connectionStatus.results.target.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {connectionStatus.results.target.connected ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {summary && (
            <SummaryCard summary={summary} />
          )}

          {diffs.length > 0 && (
            <div className="card p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3">Filter by Policy</h3>
                  <div className="max-w-sm">
                    <select
                      value={selectedPolicy}
                      onChange={(e) => handlePolicyFilterChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Policies ({diffs.length})</option>
                      {availablePolicies.map((policy) => {
                        const count = diffs.filter(d => d.policy_name === policy).length;
                        return (
                          <option key={policy} value={policy}>
                            {policy} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3">Filter by Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={statusFilters.added}
                    onChange={() => handleStatusFilterChange('added')}
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="status-badge status-added mr-2">ADDED</span>
                  <span className="text-sm text-gray-600">({policyFilteredSummary.added})</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={statusFilters.removed}
                    onChange={() => handleStatusFilterChange('removed')}
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="status-badge status-removed mr-2">REMOVED</span>
                  <span className="text-sm text-gray-600">({policyFilteredSummary.removed})</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={statusFilters.modified}
                    onChange={() => handleStatusFilterChange('modified')}
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="status-badge status-modified mr-2">MODIFIED</span>
                  <span className="text-sm text-gray-600">({policyFilteredSummary.modified})</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={statusFilters.identical}
                    onChange={() => handleStatusFilterChange('identical')}
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="status-badge status-identical mr-2">IDENTICAL</span>
                  <span className="text-sm text-gray-600">({policyFilteredSummary.identical})</span>
                </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing: <span className="font-semibold">{filteredDiffs.length}</span> of <span className="font-semibold">{policyFilteredSummary.total}</span> permissions
                  {selectedPolicy !== 'all' && (
                    <span className="ml-2 text-blue-600">
                      • Filtered by: <span className="font-medium">{selectedPolicy}</span>
                    </span>
                  )}
                  {policyFilteredSummary.total !== diffs.length && (
                    <span className="ml-2 text-gray-500">
                      (Total available: {diffs.length})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {filteredDiffs.length > 0 && (
            <PermissionsList
              diffs={filteredDiffs}
              selectedDiffs={selectedDiffs}
              onDiffSelect={handleDiffSelect}
              onViewDiff={handleViewDiff}
              sidesFlipped={sidesFlipped}
            />
          )}

          {showDiffViewer && selectedDiff && (
            <DiffViewer
              diff={selectedDiff}
              onClose={() => setShowDiffViewer(false)}
              sidesFlipped={sidesFlipped}
            />
          )}
        </div>
      </div>
    </>
  );
}