import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, Repeat, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

interface SocialMediaReport {
  id: string;
  platform: string;
  username: string;
  content: string;
  timestamp: string;
  urgency: string;
  location: string;
  verified: boolean;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

interface SocialMediaFeedProps {
  disasterId: string;
}

const SocialMediaFeed: React.FC<SocialMediaFeedProps> = ({ disasterId }) => {
  const [reports, setReports] = useState<SocialMediaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState('');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchSocialMediaData();
  }, [disasterId]);

  const fetchSocialMediaData = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/social-media/${disasterId}/social-media?keywords=${keywords}`,
        {
          headers: {
            'X-User-Id': 'contributor'
          }
        }
      );
      const data = await response.json();
      setReports(data.reports || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching social media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchSocialMediaData();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300';
      case 'high': return 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-300';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'bluesky': return '🌤️';
      default: return '📱';
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
      {/* Search and Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
          Social Media Monitoring
        </h2>
        
        <form onSubmit={handleKeywordSearch} className="mb-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Search keywords (e.g., help, SOS, flood)"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg"
            >
              Search
            </button>
          </div>
        </form>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-slate-800">{summary.total}</div>
              <div className="text-sm text-slate-500">Total Reports</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
              <div className="text-sm text-red-500">Critical</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{summary.high}</div>
              <div className="text-sm text-orange-500">High Priority</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{summary.verified}</div>
              <div className="text-sm text-green-500">Verified</div>
            </div>
          </div>
        )}
      </div>

      {/* Social Media Posts */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800">Live Social Media Feed</h3>
          <p className="text-sm text-slate-500">Real-time monitoring of disaster-related posts</p>
        </div>
        
        <div className="divide-y divide-slate-200/50">
          {reports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-200">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getPlatformIcon(report.platform)}</div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-slate-800">@{report.username}</span>
                    {report.verified && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(report.urgency)}`}>
                      {report.urgency}
                    </span>
                  </div>
                  
                  <p className="text-slate-800 mb-3">{report.content}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>📍 {report.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-slate-500">
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{report.engagement.replies}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Repeat className="h-4 w-4" />
                      <span>{report.engagement.retweets}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{report.engagement.likes}</span>
                    </div>
                  </div>
                </div>
                
                {report.urgency === 'critical' && (
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {reports.length === 0 && (
          <div className="p-8 text-center">
            <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full w-fit mx-auto mb-4">
              <MessageCircle className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Social Media Reports</h3>
            <p className="text-slate-500">No recent posts found for this disaster. Try different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaFeed;