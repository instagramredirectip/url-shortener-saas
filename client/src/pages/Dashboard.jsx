import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Wallet, TrendingUp, Link as LinkIcon, Copy, ExternalLink, 
  Plus, ArrowUpRight, ShieldCheck, Loader2, Zap, Settings, 
  CheckCircle2, MousePointer2, Type
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [urls, setUrls] = useState([]); 
  const [adFormats, setAdFormats] = useState([]); 
  const [selectedFormat, setSelectedFormat] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newUrl, setNewUrl] = useState('');
  const [customAlias, setCustomAlias] = useState(''); // <--- NEW STATE
  const [creating, setCreating] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);

  // Stats
  const [stats, setStats] = useState({ totalClicks: 0, todayEarnings: 0 });

  // Fake chart data
  const chartData = [
    { name: 'Mon', earnings: 120 },
    { name: 'Tue', earnings: 240 },
    { name: 'Wed', earnings: 180 },
    { name: 'Thu', earnings: 350 },
    { name: 'Fri', earnings: 450 },
    { name: 'Sat', earnings: 600 },
    { name: 'Sun', earnings: user?.wallet_balance ? parseFloat(user.wallet_balance) / 5 : 550 },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboardData(), fetchAdFormats()]);
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/urls/myurls');
      if (Array.isArray(data)) {
        setUrls(data);
        const clicks = data.reduce((acc, curr) => acc + parseInt(curr.click_count || 0), 0);
        setStats({ 
          totalClicks: clicks, 
          todayEarnings: (clicks * 0.25).toFixed(2) 
        });
      } else {
        setUrls([]);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setUrls([]);
    }
  };

  const fetchAdFormats = async () => {
    try {
      const { data } = await api.get('/urls/formats');
      if (Array.isArray(data)) {
        setAdFormats(data);
      }
    } catch (err) {
      console.error("Error loading formats:", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUrl) return;
    setCreating(true);
    try {
      const payload = { 
        originalUrl: newUrl,
        alias: customAlias, // <--- SEND ALIAS TO BACKEND
        adFormatId: selectedFormat || null 
      };
      
      const { data } = await api.post('/urls/shorten', payload);
      
      toast.success('Link Created Successfully!');
      setUrls([data, ...urls]); 
      setNewUrl(''); 
      setCustomAlias(''); // Clear alias input
      setShowFormatSelector(false); 
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (shortCode) => {
    const url = `https://go.pandalime.com/${shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard!');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-green-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-1">
                Panda<span className="text-green-600">Lime</span>
              </Link>
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Pro
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-slate-700">{user?.email}</span>
                <span className="text-xs text-slate-500 font-mono">ID: {user?.id}</span>
              </div>
              <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors">
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your links and track your revenue.</p>
          </div>
          <Link to="/payouts" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5">
            <Wallet size={18} /> Withdraw Funds
          </Link>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-green-200 transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={64} className="text-green-600" /></div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Balance</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              ₹{parseFloat(user?.wallet_balance || 0).toFixed(2)}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md font-bold flex items-center gap-1"><ArrowUpRight size={14} /> +12.5%</span>
              <span className="text-slate-400">vs last week</span>
            </div>
          </motion.div>

          {/* Performance */}
          <motion.div 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
             className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp size={24} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Clicks</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalClicks}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Est. CPM</p>
                <p className="text-2xl font-bold text-slate-800">₹350</p>
              </div>
            </div>
          </motion.div>

          {/* CREATE LINK CARD */}
          <motion.div 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
             className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white md:col-span-1 col-span-1"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" /> Create New Link
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* URL Input */}
              <div className="relative">
                <input 
                  type="url" 
                  placeholder="Paste URL (e.g. instagram.com/reel...)" 
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 focus:border-green-500/50 transition-all text-sm"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                  <LinkIcon size={16} />
                </div>
              </div>

              {/* CUSTOM ALIAS INPUT (Added Back) */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Custom Alias (Optional, e.g. 'my-cool-link')" 
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 focus:border-green-500/50 transition-all text-sm"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  maxLength={20}
                />
                <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                  <Type size={16} />
                </div>
              </div>

              {/* Format Selector Toggle */}
              <div>
                <button 
                  type="button"
                  onClick={() => setShowFormatSelector(!showFormatSelector)}
                  className="w-full flex items-center justify-between text-xs font-semibold bg-black/20 hover:bg-black/30 p-2 rounded-lg text-slate-300 transition-colors"
                >
                   <span>Monetization: <span className="text-white">{selectedFormat === "" ? "Direct (No Ads)" : "High Paying Ads"}</span></span>
                   <Settings size={14} />
                </button>

                {/* The Modern Grid Selector */}
                {showFormatSelector && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-3 grid grid-cols-1 gap-2 overflow-hidden"
                  >
                    {/* Guaranteed No Ads Option */}
                    <div 
                      onClick={() => setSelectedFormat("")}
                      className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-between group ${
                        selectedFormat === "" 
                        ? 'border-green-500 bg-green-500/20' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedFormat === "" ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            <MousePointer2 size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Direct Link</p>
                            <p className="text-[10px] text-slate-400">No Ads • Instant Redirect</p>
                          </div>
                       </div>
                       {selectedFormat === "" && <CheckCircle2 size={18} className="text-green-500" />}
                    </div>

                    {/* DB Formats */}
                    {adFormats.map((fmt) => (
                      <div 
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-between group ${
                          selectedFormat === fmt.id 
                          ? 'border-yellow-500 bg-yellow-500/20' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selectedFormat === fmt.id ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400'}`}>
                              <Zap size={16} fill="currentColor" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{fmt.name}</p>
                              <p className="text-[10px] text-yellow-200">Earn ₹{fmt.cpm_rate}/1k Views</p>
                            </div>
                         </div>
                         {selectedFormat === fmt.id && <CheckCircle2 size={18} className="text-yellow-500" />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Submit Button */}
              <button 
                disabled={creating || !newUrl}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
              >
                {creating ? <Loader2 className="animate-spin w-5 h-5" /> : <>Create Short Link <ArrowUpRight size={18} /></>}
              </button>
            </form>
          </motion.div>
        </div>

        {/* LINKS LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[320px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-800">Revenue Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="earnings" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-800">Your Links</h3>
                <span className="text-xs font-semibold text-slate-400">{urls.length} Total</span>
              </div>
              
              {urls.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <LinkIcon size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No links yet. Create one to start earning!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {urls.map((url) => (
                    <div key={url.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${url.is_monetized ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                          {url.is_monetized ? <Zap size={20} fill="currentColor" /> : <LinkIcon size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate text-sm">
                            go.pandalime.com/{url.short_code}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-xs">
                            {url.original_url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden md:block text-right mr-4">
                          <p className="text-xs font-bold text-slate-700">{url.click_count} clicks</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${url.is_monetized ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                            {url.is_monetized ? 'Monetized' : 'No Ads'}
                          </span>
                        </div>
                        <button onClick={() => copyToClipboard(url.short_code)} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-green-600 transition-all">
                          <Copy size={16} />
                        </button>
                        <a href={url.original_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition-all">
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" /> Account Status
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Fraud Score</span>
                  <span className={`font-bold ${user?.fraud_score > 20 ? 'text-red-500' : 'text-green-600'}`}>
                    {user?.fraud_score || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${user?.fraud_score > 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min(user?.fraud_score || 0, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400">Keep traffic real to avoid bans.</p>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Zap size={18} fill="currentColor" /> Pro Tip
              </h4>
              <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                "Interstitial Ads" pay 2x more than standard banners. Use them for your most viral content.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;