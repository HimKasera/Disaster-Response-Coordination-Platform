import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Tent, Heart, Zap, Package } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

interface Resource {
  id: string;
  name: string;
  location_name: string;
  type: string;
  description: string;
  created_by: string;
  created_at: string;
  distance_meters?: number;
}

interface ResourceMapProps {
  disasterId: string;
}

const ResourceMap: React.FC<ResourceMapProps> = ({ disasterId }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location_name: '',
    type: '',
    description: ''
  });

  useEffect(() => {
    fetchResources();
  }, [disasterId]);

  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_BASE}/resources/${disasterId}/resources`, {
        headers: {
          'X-User-Id': 'contributor'
        }
      });
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/resources/${disasterId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'contributor'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ name: '', location_name: '', type: '', description: '' });
        setShowForm(false);
        fetchResources();
      }
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'shelter': return <Tent className="h-5 w-5 text-blue-600" />;
      case 'medical': return <Heart className="h-5 w-5 text-red-600" />;
      case 'utilities': return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'supplies': return <Package className="h-5 w-5 text-green-600" />;
      default: return <MapPin className="h-5 w-5 text-slate-600" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'shelter': return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      case 'medical': return 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200';
      case 'utilities': return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 'supplies': return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      default: return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
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
      {/* Header and Add Resource Button */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Resource Map
            </h2>
            <p className="text-sm text-slate-500">Available resources and facilities</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Resource</span>
          </button>
        </div>

        {/* Add Resource Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Resource Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="e.g., Red Cross Shelter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="e.g., Lower East Side, NYC"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Resource Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              >
                <option value="">Select type...</option>
                <option value="shelter">Shelter</option>
                <option value="medical">Medical</option>
                <option value="utilities">Utilities</option>
                <option value="supplies">Supplies</option>
                <option value="food">Food</option>
                <option value="transportation">Transportation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                placeholder="Describe the resource and its availability..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium shadow-lg"
              >
                Add Resource
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Resources List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-800">Available Resources</h3>
          <p className="text-sm text-slate-500">{resources.length} resource{resources.length !== 1 ? 's' : ''} found</p>
        </div>
        
        <div className="divide-y divide-slate-200/50">
          {resources.map((resource) => (
            <div key={resource.id} className={`p-6 border-l-4 ${getResourceColor(resource.type)} hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-200`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-white/70 rounded-lg">
                  {getResourceIcon(resource.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold text-slate-800">{resource.name}</h4>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200">
                      {resource.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>{resource.location_name || 'Location not specified'}</span>
                    </div>
                    {resource.distance_meters && (
                      <div>
                        <span>{(resource.distance_meters / 1000).toFixed(1)}km away</span>
                      </div>
                    )}
                  </div>
                  
                  {resource.description && (
                    <p className="text-slate-700 mb-3">{resource.description}</p>
                  )}
                  
                  <div className="text-xs text-slate-500">
                    Added by {resource.created_by} • {new Date(resource.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {resources.length === 0 && (
          <div className="p-8 text-center">
            <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full w-fit mx-auto mb-4">
              <MapPin className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Resources Found</h3>
            <p className="text-slate-500">Add resources to help coordinate disaster response efforts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceMap;