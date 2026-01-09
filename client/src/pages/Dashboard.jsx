import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Copy, ExternalLink, Trash2, Link as LinkIcon, Loader2, LogOut, Wand2 } from 'lucide-react';
import AnalyticsCard from '../components/AnalyticsCard';

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newUrl, setNewUrl] = useState('');
  const [customAlias, setCustomAlias] = useState(''); // NEW STATE
  const [creating, setCreating] = useState(false);
  
  // Analytics State
  const [expandedUrlId, setExpandedUrlId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);

  const navigate = useNavigate();

  // Load URLs
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const { data } = await api.get('/urls/myurls');
        setUrls(data);
      } catch (error) {
        toast.error('Failed to load your links');
        if (error.response && error.response.status === 401) {
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUrls();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.success('Logged out');
  };

  // Create Link with Custom Alias
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl) return;

    setCreating(true);
    try {
      // Send both originalUrl AND customAlias
      const { data } = await api.post('/urls/shorten', { 
        originalUrl: newUrl,
        customAlias: customAlias || undefined // Send undefined if empty
      });
      
      setUrls([data, ...urls]); 
      setNewUrl('');
      setCustomAlias('');
      toast.success('Link shortened!');
    } catch (error) {
      console.error(error);
      // specific error message from backend (e.g., "Alias taken")
      const msg = error.response?.data?.error || 'Could not shorten link';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.delete(`/urls/${id}`);
      setUrls(urls.filter((url) => url.id !== id));
      toast.success('Link deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleAnalytics = async (urlId) => {
    if (expandedUrlId === urlId) {
      setExpandedUrlId(null);
      setAnalyticsData([]);
      return;
    }
    try {
      setAnalyticsData([]); 
      setExpandedUrlId(urlId);
      const { data } = await api.get(`/urls/${urlId}/analytics`);
      setAnalyticsData(data);
    } catch (error) {
      toast.error('Could not load stats');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-primary">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{urls.length} Active Links</p>
        </div>
        <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
        >
            <LogOut size={18} />
            Logout
        </button>
      </div>

      {/* CREATE LINK CARD (Updated) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <LinkIcon size={20} className="text-primary" />
          Create New Link
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Long URL Input */}
            <input
              type="url"
              placeholder="Paste long URL (https://...)"
              className="flex-[2] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
            
            {/* Custom Alias Input */}
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Wand2 size={16} />
                </div>
                <input
                    type="text"
                    placeholder="Alias (e.g. bubble)"
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    maxLength={20}
                />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="bg-primary hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2 min-w-[140px]"
            >
              {creating ? <Loader2 className="animate-spin" size={20} /> : 'Shorten'}
            </button>
          </div>
          
          <p className="text-xs text-gray-400 pl-1">
            * Custom alias is optional. Leave blank for a random code.
          </p>
        </form>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {urls.length === 0 && (
            <div className="text-center py-10 text-gray-400">No links created yet.</div>
        )}

        {urls.map((url) => {
          const code = url.short_code || url.shortCode || 'ERROR';
          const shortUrlDisplay = `go.pandalime.com/${code}`;
          const fullLink = `https://${shortUrlDisplay}`;

          return (
            <div 
              key={url.id} 
              className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${
                expandedUrlId === url.id ? 'border-primary ring-1 ring-primary/20' : 'border-gray-100 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* URL Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <a href={fullLink} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-primary hover:underline truncate">
                      {shortUrlDisplay}
                    </a>
                    {/* Show badge if custom alias (checking if code is not random looking) */}
                    {code.length !== 6 && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">Custom</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm truncate">{url.original_url}</p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-full mr-2">
                    <BarChart2 size={14} />
                    <span>{url.click_count || 0}</span>
                  </div>

                  <button onClick={() => { navigator.clipboard.writeText(fullLink); toast.success('Copied!'); }} className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg">
                    <Copy size={18} />
                  </button>

                  <a href={fullLink} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg">
                    <ExternalLink size={18} />
                  </a>

                  <button onClick={() => toggleAnalytics(url.id)} className={`p-2 rounded-lg flex items-center gap-2 ${expandedUrlId === url.id ? 'text-primary bg-indigo-50' : 'text-gray-400 hover:text-primary'}`}>
                    <BarChart2 size={18} />
                  </button>

                  <button onClick={() => handleDelete(url.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {expandedUrlId === url.id && (
                <div className="animate-fade-in-down">
                  <AnalyticsCard data={analyticsData} shortUrl={fullLink} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;