import React from 'react';

interface SummaryCardProps {
  summary: {
    total: number;
    added: number;
    removed: number;
    modified: number;
    identical: number;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparison Summary</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.added}</div>
          <div className="text-sm text-gray-600">Added</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{summary.removed}</div>
          <div className="text-sm text-gray-600">Removed</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.modified}</div>
          <div className="text-sm text-gray-600">Modified</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{summary.identical}</div>
          <div className="text-sm text-gray-600">Identical</div>
        </div>
      </div>
      
      {summary.total > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Changes needed: <span className="font-semibold">{summary.added + summary.removed + summary.modified}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;