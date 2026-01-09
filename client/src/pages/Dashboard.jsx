import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Copy, ExternalLink, Trash2, Link as LinkIcon, Loader2, LogOut } from 'lucide-react';
import AnalyticsCard from '../components/AnalyticsCard';

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);
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
        // Only show error if it's NOT an auth error (auth errors handled by interceptor/redirect)
        if (error.response && error.response.status !== 401) {
             toast.error('Failed to load your links');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUrls();
  }, [navigate]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.success('Logged out');
  };

  // Create Link
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl) return;

    setCreating(true);
    try {
      const { data } = await api.post('/urls/shorten', { originalUrl: newUrl });
      // Add new link to top of list immediately
      setUrls([data, ...urls]); 
      setNewUrl('');
      toast.success('Link shortened!');
    } catch (error) {
      console.error(error);
      toast.error('Could not shorten link');
    } finally {
      setCreating(false);
    }
  };

  // Delete Link
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

  // Toggle Analytics
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
      
      {/* Header with Logout */}
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

      {/* Create Link Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <LinkIcon size={20} className="text-primary" />
          Shorten a new Link
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="Paste your long URL here..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-primary hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2 min-w-[140px]"
          >
            {creating ? <Loader2 className="animate-spin" size={20} /> : 'Shorten URL'}
          </button>
        </form>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {urls.length === 0 && (
            <div className="text-center py-10 text-gray-400">No links created yet.</div>
        )}

        {urls.map((url) => {
          // CRITICAL FIX: Check for 'short_code' (snake_case) which comes from Postgres
          const code = url.short_code || url.shortCode; 
          
          // Only render if code exists to avoid "go.pandalime.com/" error
          if (!code) return null; 

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