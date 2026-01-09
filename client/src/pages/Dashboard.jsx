import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Copy, LogOut, BarChart, ExternalLink } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's links on load
  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const { data } = await api.get('/urls/mine');
      setUrls(data);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      await api.post('/urls/shorten', formData);
      toast.success('URL shortened!');
      reset(); // Clear form
      fetchUrls(); // Refresh list
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to shorten URL';
      toast.error(msg);
    }
  };

  const copyToClipboard = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-primary">URL Shortener</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm hidden sm:block">
                {user?.email}
              </span>
              <button 
                onClick={logout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        
        {/* Create New Link Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Shorten a new Link</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="url"
                placeholder="Paste your long URL here (e.g., https://super-long-site.com/...)"
                {...register('originalUrl', { required: 'URL is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
              {errors.originalUrl && <p className="text-red-500 text-sm mt-1">{errors.originalUrl.message}</p>}
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 whitespace-nowrap"
            >
              {isSubmitting ? 'Shortening...' : 'Shorten URL'}
            </button>
          </form>
        </div>

        {/* Links List */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Links</h3>
          
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading your history...</div>
          ) : urls.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">You haven't shortened any links yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {urls.map((url) => (
                <div key={url.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a href={url.shortUrl} target="_blank" rel="noreferrer" className="text-lg font-bold text-primary hover:underline truncate">
                        {url.shortUrl}
                      </a>
                      <button onClick={() => copyToClipboard(url.shortUrl)} className="text-gray-400 hover:text-gray-600" title="Copy">
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <ExternalLink size={12} />
                      <p className="truncate max-w-md">{url.original_url}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-full text-sm">
                      <BarChart size={16} />
                      <span className="font-semibold">{url.click_count}</span>
                      <span className="text-xs">clicks</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(url.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;