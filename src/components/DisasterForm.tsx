import React, { useState } from 'react';
import { Plus, MapPin, Tag, FileText } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

interface DisasterFormProps {
  onDisasterCreated: () => void;
}

const DisasterForm: React.FC<DisasterFormProps> = ({ onDisasterCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    location_name: '',
    description: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/disasters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'contributor'
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      });

      if (response.ok) {
        setFormData({ title: '', location_name: '', description: '', tags: '' });
        setShowForm(false);
        onDisasterCreated();
      } else {
        console.error('Failed to create disaster');
      }
    } catch (error) {
      console.error('Error creating disaster:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!showForm) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">Report New Disaster</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Report New Disaster
        </h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            <span>Disaster Title</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            placeholder="e.g., NYC Flood Emergency"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
            <MapPin className="h-4 w-4 text-green-500" />
            <span>Location</span>
          </label>
          <input
            type="text"
            name="location_name"
            value={formData.location_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            placeholder="e.g., Manhattan, NYC"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span>Description</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            placeholder="Provide detailed information about the disaster, affected areas, and immediate needs..."
          />
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
            <Tag className="h-4 w-4 text-purple-500" />
            <span>Tags</span>
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            placeholder="e.g., flood, urgent, transportation (comma-separated)"
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
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
          >
            {loading ? 'Creating...' : 'Create Disaster Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DisasterForm;