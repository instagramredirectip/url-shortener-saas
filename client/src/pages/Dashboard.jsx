import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BarChart2, Copy, ExternalLink, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import AnalyticsCard from '../components/AnalyticsCard';

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);

  // --- NEW STATE: Analytics Tracking ---
  const [expandedUrlId, setExpandedUrlId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);

  // Fetch all URLs on load
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const { data } = await api.get('/urls/myurls');
        setUrls(data);
      } catch (error) {
        toast.error('Failed to load your links');
      } finally {
        setLoading(false);
      }
    };
    fetchUrls();
  }, []);

  // Create a new short link
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl) return;

    setCreating(true);
    try {
      const { data } = await api.post('/urls/shorten', { originalUrl: newUrl });
      setUrls([data, ...urls]); // Add new link to top of list
      setNewUrl('');
      toast.success('Link shortened successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Could not shorten link. Try again.');
    } finally {
      setCreating(false);
    }
  };

  // Delete a link
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await api.delete(`/urls/${id}`);
      setUrls(urls.filter((url) => url.id !== id));
      toast.success('Link deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // --- NEW FUNCTION: Toggle Analytics Card ---
  const toggleAnalytics = async (urlId) => {
    // If clicking the same card that is already open, close it
    if (expandedUrlId === urlId) {
      setExpandedUrlId(null);
      setAnalyticsData([]);
      return;
    }

    // Otherwise, open it and fetch data
    try {
      // Show empty state briefly while loading (optional)
      setAnalyticsData([]); 
      setExpandedUrlId(urlId);
      
      const { data } = await api.get(`/urls/${urlId}/analytics`);
      setAnalyticsData(data);
    } catch (error) {
      console.error(error);
      toast.error('Could not load analytics data');
      setExpandedUrlId(null); // Close if error
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
        <span className="bg-indigo-50 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {urls.length} Links Active
        </span>
      </div>

      {/* Creation Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <LinkIcon size={20} className="text-primary" />
          Shorten a new Link
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="Paste your long URL here (e.g., https://super-long-site.com/...)"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-primary hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="animate-spin" size={20} /> : 'Shorten URL'}
          </button>
        </form>
      </div>

      {/* Links List */}
      <h3 className="text-xl font-bold text-gray-800 mb-6">Your Links</h3>
      
      {urls.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-2">You haven't created any links yet.</p>
          <p className="text-sm text-gray-400">Paste a URL above to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {urls.map((url) => {
            // Construct the display URL using your subdomain
            const shortUrl = `https://go.pandalime.com/${url.short_code}`;

            return (
              <div 
                key={url.id} 
                className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 ${
                  expandedUrlId === url.id ? 'border-primary ring-1 ring-primary/20' : 'border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: URL Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <a 
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-primary hover:underline truncate"
                      >
                        {/* Remove https:// for cleaner look if desired */}
                        go.pandalime.com/{url.short_code}
                      </a>
                    </div>
                    <p className="text-gray-400 text-sm truncate" title={url.original_url}>
                      {url.original_url}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    
                    {/* Clicks Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-full mr-2 border border-gray-100">
                      <BarChart2 size={14} />
                      <span className="font-medium">{url.click_count || 0}</span>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shortUrl);
                        toast.success('Copied to clipboard!');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy Link"
                    >
                      <Copy size={18} />
                    </button>

                    {/* Visit Button */}
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Visit Link"
                    >
                      <ExternalLink size={18} />
                    </a>

                    {/* Analytics Toggle Button */}
                    <button
                      onClick={() => toggleAnalytics(url.id)}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                        expandedUrlId === url.id 
                          ? 'text-primary bg-indigo-50' 
                          : 'text-gray-400 hover:text-primary hover:bg-indigo-50'
                      }`}
                      title="View Analytics"
                    >
                      <BarChart2 size={18} />
                      {expandedUrlId === url.id && <span className="text-sm font-medium pr-1">Stats</span>}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(url.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE SECTION: Analytics Card */}
                {expandedUrlId === url.id && (
                  <div className="animate-fade-in-down">
                    <AnalyticsCard 
                      data={analyticsData} 
                      shortUrl={shortUrl} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;