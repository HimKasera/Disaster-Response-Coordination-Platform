import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, Users, Shield, Zap, Radio, FileText } from 'lucide-react';
import io from 'socket.io-client';
import DisasterForm from './components/DisasterForm';
import DisasterList from './components/DisasterList';
import SocialMediaFeed from './components/SocialMediaFeed';
import ResourceMap from './components/ResourceMap';
import OfficialUpdates from './components/OfficialUpdates';
import ImageVerification from './components/ImageVerification';

const API_BASE = 'http://localhost:3001/api';

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

function App() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('disasters');
  const [socket, setSocket] = useState<any>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Listen for real-time updates
    newSocket.on('disaster_updated', (data) => {
      console.log('Disaster update received:', data);
      setNotifications(prev => [...prev, `Disaster ${data.action}: ${data.disaster.title}`]);
      fetchDisasters();
    });

    newSocket.on('social_media_updated', (data) => {
      console.log('Social media update:', data);
      setNotifications(prev => [...prev, `New social media reports for disaster ${data.disaster_id}`]);
    });

    newSocket.on('resources_updated', (data) => {
      console.log('Resources update:', data);
      setNotifications(prev => [...prev, `Resources updated for disaster ${data.disaster_id}`]);
    });

    fetchDisasters();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchDisasters = async () => {
    try {
      const response = await fetch(`${API_BASE}/disasters`, {
        headers: {
          'X-User-Id': 'contributor'
        }
      });
      const data = await response.json();
      setDisasters(data.disasters || []);
    } catch (error) {
      console.error('Error fetching disasters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisasterSelect = (disaster: Disaster) => {
    setSelectedDisaster(disaster);
    if (socket) {
      socket.emit('join_disaster', disaster.id);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const tabs = [
    { id: 'disasters', label: 'Disasters', icon: AlertTriangle },
    { id: 'social', label: 'Social Media', icon: Radio },
    { id: 'resources', label: 'Resources', icon: MapPin },
    { id: 'updates', label: 'Official Updates', icon: FileText },
    { id: 'verification', label: 'Verification', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading disaster response platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Disaster Response Platform
                </h1>
                <p className="text-sm text-slate-500">Real-time coordination and resource management</p>
              </div>
            </div>
            
            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="relative">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 max-w-md shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-amber-100 rounded-full">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-semibold text-amber-800">
                        {notifications.length} new update{notifications.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={clearNotifications}
                      className="text-amber-600 hover:text-amber-800 text-sm font-medium transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-amber-700">
                    {notifications[notifications.length - 1]}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'disasters' && (
              <div className="space-y-6">
                <DisasterForm onDisasterCreated={fetchDisasters} />
                <DisasterList 
                  disasters={disasters} 
                  onSelectDisaster={handleDisasterSelect}
                  selectedDisaster={selectedDisaster}
                />
              </div>
            )}
            
            {activeTab === 'social' && selectedDisaster && (
              <SocialMediaFeed disasterId={selectedDisaster.id} />
            )}
            
            {activeTab === 'resources' && selectedDisaster && (
              <ResourceMap disasterId={selectedDisaster.id} />
            )}
            
            {activeTab === 'updates' && selectedDisaster && (
              <OfficialUpdates disasterId={selectedDisaster.id} />
            )}
            
            {activeTab === 'verification' && selectedDisaster && (
              <ImageVerification disasterId={selectedDisaster.id} />
            )}
            
            {activeTab !== 'disasters' && !selectedDisaster && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-slate-200/50">
                <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full w-fit mx-auto mb-4">
                  <AlertTriangle className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a Disaster</h3>
                <p className="text-slate-500">Choose a disaster from the list to view {activeTab} information.</p>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Statistics Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Active Disasters</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{disasters.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Connected Users</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{socket?.connected ? '1' : '0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Last Update</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Disaster Info */}
            {selectedDisaster && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Selected Disaster</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{selectedDisaster.title}</p>
                    <p className="text-sm text-slate-500">{selectedDisaster.location_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDisaster.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Created: {new Date(selectedDisaster.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200">
                  📧 Send Emergency Alert
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200">
                  📊 Generate Report
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200">
                  🗺️ View Full Map
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200">
                  📱 Mobile App
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;