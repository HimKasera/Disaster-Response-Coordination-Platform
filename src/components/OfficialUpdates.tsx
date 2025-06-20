import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Flag, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

interface OfficialUpdate {
  id: string;
  source: string;
  title: string;
  content: string;
  url: string;
  timestamp: string;
  category: string;
  priority: string;
}

interface OfficialUpdatesProps {
  disasterId: string;
}

const OfficialUpdates: React.FC<OfficialUpdatesProps> = ({ disasterId }) => {
  const [updates, setUpdates] = useState<OfficialUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    fetchOfficialUpdates();
  }, [disasterId, selectedSource]);

  const fetchOfficialUpdates = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/updates/${disasterId}/official-updates?source=${selectedSource}`,
        {
          headers: {
            'X-User-Id': 'contributor'
          }
        }
      );
      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (error) {
      console.error('Error fetching official updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300';
      case 'high': return 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-300';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'fema': return '🏛️';
      case 'red cross': return '❤️';
      case 'national weather service': return '🌦️';
      default: return '📢';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'relief_centers': return '🏢';
      case 'assistance': return '🤝';
      case 'shelters': return '🏠';
      case 'volunteers': return '👥';
      case 'weather': return '🌡️';
      case 'conditions': return '📊';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Official Updates
            </h2>
            <p className="text-sm text-slate-500">Latest information from government and relief organizations</p>
          </div>
          
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
          >
            <option value="all">All Sources</option>
            <option value="fema">FEMA</option>
            <option value="redcross">Red Cross</option>
            <option value="nws">National Weather Service</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{updates.length}</div>
            <div className="text-sm text-blue-500">Total Updates</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {updates.filter(u => u.priority === 'critical').length}
            </div>
            <div className="text-sm text-red-500">Critical Alerts</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {new Set(updates.map(u => u.source)).size}
            </div>
            <div className="text-sm text-green-500">Active Sources</div>
          </div>
        </div>
      </div>

      {/* Updates List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800">Recent Updates</h3>
          <p className="text-sm text-slate-500">Sorted by most recent</p>
        </div>
        
        <div className="divide-y divide-slate-200/50">
          {updates.map((update) => (
            <div key={update.id} className="p-6 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-3xl p-2 bg-white/70 rounded-lg">
                  {getSourceIcon(update.source)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold text-slate-800">{update.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(update.priority)}`}>
                      {update.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Flag className="h-4 w-4 text-indigo-500" />
                      <span>{update.source}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span>{new Date(update.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>{getCategoryIcon(update.category)}</span>
                      <span className="capitalize">{update.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-700 mb-4">{update.content}</p>
                  
                  <a
                    href={update.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Read full update</span>
                  </a>
                </div>
                
                {update.priority === 'critical' && (
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {updates.length === 0 && (
          <div className="p-8 text-center">
            <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full w-fit mx-auto mb-4">
              <Flag className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Official Updates</h3>
            <p className="text-slate-500">No recent updates found from official sources.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialUpdates;