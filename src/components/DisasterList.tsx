import React from 'react';
import { MapPin, Clock, User, AlertTriangle } from 'lucide-react';

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
  reports?: any[];
}

interface DisasterListProps {
  disasters: Disaster[];
  onSelectDisaster: (disaster: Disaster) => void;
  selectedDisaster: Disaster | null;
}

const DisasterList: React.FC<DisasterListProps> = ({ 
  disasters, 
  onSelectDisaster, 
  selectedDisaster 
}) => {
  const getUrgencyColor = (tags: string[]) => {
    if (tags.includes('critical') || tags.includes('urgent')) {
      return 'bg-gradient-to-r from-red-100 to-orange-100 border-red-300 text-red-800';
    } else if (tags.includes('high')) {
      return 'bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300 text-orange-800';
    }
    return 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-800';
  };

  const getUrgencyIcon = (tags: string[]) => {
    if (tags.includes('critical') || tags.includes('urgent')) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-blue-600" />;
  };

  if (disasters.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-slate-200/50">
        <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full w-fit mx-auto mb-4">
          <AlertTriangle className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Disasters Reported</h3>
        <p className="text-slate-500">Create a new disaster report to begin coordination efforts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
        <h2 className="text-lg font-semibold text-slate-800">Active Disasters</h2>
        <p className="text-sm text-slate-500">{disasters.length} reported incident{disasters.length > 1 ? 's' : ''}</p>
      </div>
      
      <div className="divide-y divide-slate-200/50">
        {disasters.map((disaster) => (
          <div
            key={disaster.id}
            onClick={() => onSelectDisaster(disaster)}
            className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 ${
              selectedDisaster?.id === disaster.id ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getUrgencyIcon(disaster.tags)}
                  <h3 className="text-lg font-semibold text-slate-800">{disaster.title}</h3>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span>{disaster.location_name || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{new Date(disaster.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4 text-purple-500" />
                    <span>{disaster.owner_id}</span>
                  </div>
                </div>
                
                <p className="text-slate-700 mb-3 line-clamp-2">{disaster.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {disaster.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(disaster.tags)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="ml-4 text-right">
                {disaster.reports && disaster.reports.length > 0 && (
                  <div className="text-sm text-slate-500 mb-2">
                    {disaster.reports.length} report{disaster.reports.length > 1 ? 's' : ''}
                  </div>
                )}
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisasterList;