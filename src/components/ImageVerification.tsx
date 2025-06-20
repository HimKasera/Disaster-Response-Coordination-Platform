import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertTriangle, Eye, Camera } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

interface VerificationResult {
  image_url: string;
  disaster_id: string;
  verification: {
    authentic: boolean | null;
    confidence: number;
    disaster_evidence: boolean | null;
    disaster_type: string | null;
    manipulation_signs: string[];
    authenticity_score: number | null;
    analysis: string;
  };
  verified_at: string;
  verified_by: string;
  error?: string;
}

interface ImageVerificationProps {
  disasterId: string;
}

const ImageVerification: React.FC<ImageVerificationProps> = ({ disasterId }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([]);

  const handleVerifyImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verification/${disasterId}/verify-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'contributor'
        },
        body: JSON.stringify({
          image_url: imageUrl,
          description
        })
      });

      const result = await response.json();
      setVerificationResult(result);
      setVerificationHistory(prev => [result, ...prev]);
      setImageUrl('');
      setDescription('');
    } catch (error) {
      console.error('Error verifying image:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthenticityIcon = (authentic: boolean | null) => {
    if (authentic === null) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return authentic ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getAuthenticityColor = (authentic: boolean | null) => {
    if (authentic === null) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    return authentic ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200';
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Image Verification Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200/50">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Image Verification
          </h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Use AI to analyze disaster images for authenticity and manipulation signs
        </p>

        <form onSubmit={handleVerifyImage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              placeholder="https://example.com/disaster-image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
              placeholder="Provide context about the image (location, time, source, etc.)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
          >
            <Eye className="h-4 w-4" />
            <span>{loading ? 'Analyzing...' : 'Verify Image'}</span>
          </button>
        </form>
      </div>

      {/* Latest Verification Result */}
      {verificationResult && (
        <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-l-4 p-6 border border-slate-200/50 ${getAuthenticityColor(verificationResult.verification.authentic)}`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-white/70 rounded-lg">
              {getAuthenticityIcon(verificationResult.verification.authentic)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-lg font-semibold text-slate-800">Verification Result</h3>
                {verificationResult.verification.authenticity_score !== null && (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/70 ${getScoreColor(verificationResult.verification.authenticity_score)}`}>
                    Score: {verificationResult.verification.authenticity_score}/10
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-white/50 rounded-lg">
                  <strong className="text-sm text-slate-700">Authenticity:</strong>
                  <p className="text-sm text-slate-600 mt-1">
                    {verificationResult.verification.authentic === null 
                      ? 'Unable to determine' 
                      : verificationResult.verification.authentic 
                        ? 'Likely authentic' 
                        : 'Potentially manipulated'
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-white/50 rounded-lg">
                  <strong className="text-sm text-slate-700">Confidence:</strong>
                  <p className="text-sm text-slate-600 mt-1">
                    {(verificationResult.verification.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="p-3 bg-white/50 rounded-lg">
                  <strong className="text-sm text-slate-700">Disaster Evidence:</strong>
                  <p className="text-sm text-slate-600 mt-1">
                    {verificationResult.verification.disaster_evidence === null 
                      ? 'Unable to determine' 
                      : verificationResult.verification.disaster_evidence 
                        ? 'Yes' 
                        : 'No'
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-white/50 rounded-lg">
                  <strong className="text-sm text-slate-700">Disaster Type:</strong>
                  <p className="text-sm text-slate-600 mt-1">
                    {verificationResult.verification.disaster_type || 'Not identified'}
                  </p>
                </div>
              </div>

              {verificationResult.verification.manipulation_signs.length > 0 && (
                <div className="mb-4 p-3 bg-white/50 rounded-lg">
                  <strong className="text-sm text-slate-700">Potential Issues:</strong>
                  <ul className="text-sm text-slate-600 list-disc list-inside mt-1">
                    {verificationResult.verification.manipulation_signs.map((sign, index) => (
                      <li key={index}>{sign}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-4 p-3 bg-white/50 rounded-lg">
                <strong className="text-sm text-slate-700">Analysis:</strong>
                <p className="text-sm text-slate-600 mt-1">
                  {verificationResult.verification.analysis}
                </p>
              </div>

              {verificationResult.error && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> {verificationResult.error}
                  </p>
                </div>
              )}

              <div className="text-xs text-slate-500">
                Verified {new Date(verificationResult.verified_at).toLocaleString()} by {verificationResult.verified_by}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification History */}
      {verificationHistory.length > 1 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
            <h3 className="text-lg font-semibold text-slate-800">Verification History</h3>
            <p className="text-sm text-slate-500">{verificationHistory.length} image{verificationHistory.length > 1 ? 's' : ''} analyzed</p>
          </div>
          
          <div className="divide-y divide-slate-200/50">
            {verificationHistory.slice(1).map((result, index) => (
              <div key={index} className="p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 p-2 bg-white/70 rounded-lg">
                    {getAuthenticityIcon(result.verification.authentic)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">
                        {result.verification.authentic === null 
                          ? 'Inconclusive' 
                          : result.verification.authentic 
                            ? 'Authentic' 
                            : 'Suspicious'
                        }
                      </span>
                      {result.verification.authenticity_score !== null && (
                        <span className={`text-xs px-2 py-1 rounded-full bg-white/70 ${getScoreColor(result.verification.authenticity_score)}`}>
                          {result.verification.authenticity_score}/10
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(result.verified_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {(result.verification.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">How to use Image Verification</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Paste the URL of an image you want to verify</li>
              <li>• Add context about the image if available</li>
              <li>• AI will analyze for signs of manipulation and disaster evidence</li>
              <li>• Review the authenticity score and detailed analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageVerification;