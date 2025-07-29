import React from 'react';
import { PermissionDiff } from '../lib/permissions';
import CollapsiblePanel from './CollapsiblePanel';

interface DiffViewerProps {
  diff: PermissionDiff;
  onClose: () => void;
  sidesFlipped?: boolean;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diff, onClose, sidesFlipped = false }) => {
  const normalizeFields = (fieldsString: string | null): string | null => {
    if (!fieldsString) return fieldsString;
    return fieldsString
      .split(',')
      .map(field => field.trim())
      .filter(field => field.length > 0)
      .sort()
      .join(',');
  };

  const formatPermissionData = (permission: any) => {
    if (!permission) return 'None';
    
    return JSON.stringify({
      permissions: permission.permissions,
      validation: permission.validation,
      presets: permission.presets,
      fields: normalizeFields(permission.fields), // Show normalized fields
    }, null, 2);
  };

  const formatFieldsList = (fieldsString: string | null) => {
    if (!fieldsString) return [];
    return fieldsString
      .split(',')
      .map(field => field.trim())
      .filter(field => field.length > 0)
      .sort(); // Sort fields for consistent display
  };

  const compareFields = (sourceFields: string | null, targetFields: string | null) => {
    const source = formatFieldsList(sourceFields);
    const target = formatFieldsList(targetFields);
    
    // Backend already handles flipping by swapping the actual data in sourcePermission/targetPermission
    // Sync direction: source -> target
    // So "added" = fields in source that will be added to target (fields in source not in target)
    // And "removed" = fields in target that will be removed (fields in target not in source)
    const added = source.filter(field => !target.includes(field));
    const removed = target.filter(field => !source.includes(field));
    const common = source.filter(field => target.includes(field));
    return { added, removed, common };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'border-green-500 bg-green-50';
      case 'removed':
        return 'border-red-500 bg-red-50';
      case 'modified':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Permission Diff</h2>
              <p className="text-sm text-gray-600 mt-1">
                {diff.collection} → {diff.action} → {diff.policy_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`status-badge status-${diff.status}`}>
                {diff.status.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {diff.status === 'modified' && diff.sourcePermission && diff.targetPermission && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Detailed Changes</h3>
              <div className="space-y-4">
                {Object.entries(diff.sourcePermission).map(([key, sourceValue]) => {
                  const targetValue = (diff.targetPermission as any)?.[key];
                  
                  // Normalize fields for consistent comparison display
                  const normalizedSource = key === 'fields' ? normalizeFields(sourceValue) : sourceValue;
                  const normalizedTarget = key === 'fields' ? normalizeFields(targetValue) : targetValue;
                  
                  if (normalizedSource !== normalizedTarget && key !== 'id') {
                    return (
                      <div key={key} className="bg-gray-50 rounded p-4">
                        <div className="font-medium text-gray-900 mb-3 capitalize">{key}</div>
                        
                        {key === 'fields' ? (
                          // Special handling for fields to show individual field changes
                          <div className="space-y-3">
                            {(() => {
                              // Use normalized values for comparison display
                              const normalizedSource = normalizeFields(sourceValue);
                              const normalizedTarget = normalizeFields(targetValue);
                              const fieldComparison = compareFields(normalizedSource, normalizedTarget);
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Backend already swaps the data when flipped, so always show source in Source column and target in Target column */}
                                  <div>
                                    <span className="text-sm text-blue-600 font-medium">Source Fields:</span>
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-1">
                                      {formatFieldsList(normalizedSource).length === 0 ? (
                                        <span className="text-gray-500 italic">No fields</span>
                                      ) : (
                                        <div className="flex flex-wrap gap-1">
                                          {formatFieldsList(normalizedSource).map((field, index) => (
                                            <span 
                                              key={index}
                                              className={`px-2 py-1 text-xs rounded ${
                                                fieldComparison.removed.includes(field) 
                                                  ? 'bg-red-100 text-red-800 border border-red-300' 
                                                  : 'bg-gray-100 text-gray-700'
                                              }`}
                                            >
                                              {field}
                                              {fieldComparison.removed.includes(field) && ' ➖'}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-sm text-orange-600 font-medium">Target Fields:</span>
                                    <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-1">
                                      {formatFieldsList(normalizedTarget).length === 0 ? (
                                        <span className="text-gray-500 italic">No fields</span>
                                      ) : (
                                        <div className="flex flex-wrap gap-1">
                                          {formatFieldsList(normalizedTarget).map((field, index) => (
                                            <span 
                                              key={index}
                                              className={`px-2 py-1 text-xs rounded ${
                                                fieldComparison.added.includes(field) 
                                                  ? 'bg-green-100 text-green-800 border border-green-300' 
                                                  : 'bg-gray-100 text-gray-700'
                                              }`}
                                            >
                                              {field}
                                              {fieldComparison.added.includes(field) && ' ➕'}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {(() => {
                              const fieldComparison = compareFields(normalizedSource, normalizedTarget);
                              if (fieldComparison.added.length > 0 || fieldComparison.removed.length > 0) {
                                return (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <div className="text-sm font-medium text-yellow-800 mb-2">Field Changes Summary:</div>
                                    {fieldComparison.added.length > 0 && (
                                      <div className="text-sm text-green-700 mb-1">
                                        ➕ <strong>Will be added:</strong> {fieldComparison.added.join(', ')}
                                      </div>
                                    )}
                                    {fieldComparison.removed.length > 0 && (
                                      <div className="text-sm text-red-700">
                                        ➖ <strong>Will be removed:</strong> {fieldComparison.removed.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          // Default handling for other fields
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Backend already swaps the data when flipped, so always show source in Source column and target in Target column */}
                            <div>
                              <span className="text-sm text-blue-600 font-medium">Source:</span>
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-1">
                                {key === 'permissions' || key === 'validation' || key === 'presets' ? (
                                  <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                                    {sourceValue ? JSON.stringify(JSON.parse(sourceValue), null, 2) : 'null'}
                                  </pre>
                                ) : key === 'fields' ? (
                                  <code className="text-sm text-gray-800">{normalizeFields(sourceValue) || 'null'}</code>
                                ) : (
                                  <code className="text-sm text-gray-800">{sourceValue || 'null'}</code>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-orange-600 font-medium">Target:</span>
                              <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-1">
                                {key === 'permissions' || key === 'validation' || key === 'presets' ? (
                                  <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                                    {targetValue ? JSON.stringify(JSON.parse(targetValue), null, 2) : 'null'}
                                  </pre>
                                ) : key === 'fields' ? (
                                  <code className="text-sm text-gray-800">{normalizeFields(targetValue) || 'null'}</code>
                                ) : (
                                  <code className="text-sm text-gray-800">{targetValue || 'null'}</code>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <CollapsiblePanel 
            title="Full Permission Data" 
            className="mt-6"
            defaultExpanded={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backend already swaps the data when flipped, so always show source in Source column and target in Target column */}
              <div className={`border-2 rounded-lg p-4 ${getStatusColor(diff.status)}`}>
                <h4 className="font-semibold text-gray-900 mb-3">Source (Left)</h4>
                <div className="bg-white rounded border p-3">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                    {formatPermissionData(diff.sourcePermission)}
                  </pre>
                </div>
              </div>

              <div className={`border-2 rounded-lg p-4 ${getStatusColor(diff.status)}`}>
                <h4 className="font-semibold text-gray-900 mb-3">Target (Right)</h4>
                <div className="bg-white rounded border p-3">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                    {formatPermissionData(diff.targetPermission)}
                  </pre>
                </div>
              </div>
            </div>
          </CollapsiblePanel>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;