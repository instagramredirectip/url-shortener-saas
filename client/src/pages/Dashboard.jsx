import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart2, Copy, ExternalLink, Trash2, Link as LinkIcon, 
  Loader2, LogOut, Wallet, Wand2, Zap, Layers, Bell, MousePointer, 
  Ban, Monitor, CheckCircle2 
} from 'lucide-react';
import AnalyticsCard from '../components/AnalyticsCard';

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [adFormats, setAdFormats] = useState([]);
  const [userStats, setUserStats] = useState({ wallet_balance: 0, total_earnings: 0 });
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newUrl, setNewUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [selectedAd, setSelectedAd] = useState(null); // 'null' means No Ads
  const [creating, setCreating] = useState(false);
  
  // Analytics State
  const [expandedUrlId, setExpandedUrlId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const [urlsRes, adsRes, meRes] = await Promise.all([
        api.get('/urls/myurls'),
        api.get('/urls/formats'),
        api.get('/auth/me')
      ]);

      setUrls(urlsRes.data);
      setAdFormats(adsRes.data);
      setUserStats(meRes.data);
      
      // Auto-select the highest paying ad by default (optional strategy)
      if (adsRes.data.length > 0) {
        setSelectedAd(adsRes.data[0].id);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
          navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.success('Logged out');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl) return;

    setCreating(true);
    try {
      const { data } = await api.post('/urls/shorten', { 
        originalUrl: newUrl,
        alias: customAlias || undefined,
        // If selectedAd is 'no_ads' or null, send null to backend
        adFormatId: selectedAd === 'no_ads' ? null : selectedAd 
      });
      
      setUrls([data, ...urls]); 
      setNewUrl('');
      setCustomAlias('');
      toast.success(selectedAd && selectedAd !== 'no_ads' ? 'Monetized link created!' : 'Simple link created!');
    } catch (error) {
      const msg = error.response?.data?.error || 'Could not shorten link';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this link?')) return;
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

  // Helper to get Icon based on ad name
  const getAdIcon = (name) => {
    if (name.includes('multitag')) return <Layers size={24} className="text-purple-600" />;
    if (name.includes('popunder')) return <MousePointer size={24} className="text-blue-600" />;
    if (name.includes('push')) return <Bell size={24} className="text-orange-600" />;
    if (name.includes('vignette')) return <Monitor size={24} className="text-indigo-600" />;
    return <Zap size={24} className="text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-primary">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back.</p>
        </div>
        <div className="flex items-center gap-3">
            <Link to="/payouts" className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-5 py-2.5 rounded-lg font-bold transition-colors">
                <Wallet size={18} />
                <span>Wallet: ₹{parseFloat(userStats.wallet_balance || 0).toFixed(2)}</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium">
                <LogOut size={18} />
            </button>
        </div>
      </div>

      {/* CREATE LINK CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <LinkIcon size={20} className="text-primary" />
          Create New Link
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[2]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Destination URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none bg-gray-50"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
            </div>
            
            <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Custom Alias (Optional)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Wand2 size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="my-link"
                        className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none bg-gray-50"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        maxLength={20}
                    />
                </div>
            </div>
          </div>

          {/* NEW: Modern Ad Selection Grid */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Select Monetization Strategy</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Render Actual Ad Formats */}
                {adFormats.map((ad) => (
                    <div 
                        key={ad.id}
                        onClick={() => setSelectedAd(ad.id)}
                        className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
                            selectedAd === ad.id 
                            ? 'border-green-500 bg-green-50 shadow-md transform scale-[1.02]' 
                            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                    >
                        {selectedAd === ad.id && (
                            <div className="absolute top-2 right-2 text-green-600">
                                <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                            </div>
                        )}
                        <div className={`p-3 rounded-lg ${selectedAd === ad.id ? 'bg-white' : 'bg-gray-100'}`}>
                            {getAdIcon(ad.display_name.toLowerCase())}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">{ad.display_name}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
                            <div className="mt-2 inline-flex items-center gap-1 bg-green-200 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <span>₹{ad.cpm_rate_inr} CPM</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 2. "No Ads" Option */}
                <div 
                    onClick={() => setSelectedAd('no_ads')}
                    className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
                        selectedAd === 'no_ads' 
                        ? 'border-gray-600 bg-gray-100 shadow-md transform scale-[1.02]' 
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                     {selectedAd === 'no_ads' && (
                        <div className="absolute top-2 right-2 text-gray-600">
                            <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                        </div>
                    )}
                    <div className="p-3 rounded-lg bg-gray-100">
                        <Ban size={24} className="text-gray-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 text-sm">No Monetization</h3>
                        <p className="text-xs text-gray-500 mt-1">Direct redirect. No ads.</p>
                        <div className="mt-2 inline-flex items-center gap-1 bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <span>₹0.00 CPM</span>
                        </div>
                    </div>
                </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="self-end bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
          >
            {creating ? <Loader2 className="animate-spin" /> : 'Create Link'}
          </button>
        </form>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {urls.length === 0 && <div className="text-center py-12 text-gray-400">Start creating links to earn money!</div>}

        {urls.map((url) => {
          const code = url.short_code || url.shortCode || 'ERROR';
          const shortUrlDisplay = `go.pandalime.com/${code}`;
          const fullLink = `https://${shortUrlDisplay}`;
          const isMonetized = url.is_monetized;

          return (
            <div key={url.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <a href={fullLink} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-primary hover:underline truncate">
                      {shortUrlDisplay}
                    </a>
                    {isMonetized ? (
                        <span className="bg-green-100 text-green-700 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wide flex items-center gap-1">
                            <Zap size={10} fill="currentColor" /> Monetized
                        </span>
                    ) : (
                        <span className="bg-gray-100 text-gray-500 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wide">
                            No Ads
                        </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm truncate max-w-md">{url.original_url}</p>
                </div>

                <div className="flex items-center gap-2">
                   <div className="hidden sm:flex items-center gap-1.5 text-gray-600 text-sm bg-gray-50 px-3 py-1.5 rounded-full mr-2">
                    <BarChart2 size={14} />
                    <span className="font-semibold">{url.click_count || 0}</span>
                  </div>

                  <button onClick={() => { navigator.clipboard.writeText(fullLink); toast.success('Copied!'); }} className="p-2 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-lg">
                    <Copy size={18} />
                  </button>

                  <button onClick={() => toggleAnalytics(url.id)} className={`p-2 rounded-lg ${expandedUrlId === url.id ? 'text-primary bg-indigo-50' : 'text-gray-400 hover:text-primary'}`}>
                    <BarChart2 size={18} />
                  </button>

                  <button onClick={() => handleDelete(url.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {expandedUrlId === url.id && (
                <div className="mt-4 pt-4 border-t border-gray-50 animate-fade-in-down">
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