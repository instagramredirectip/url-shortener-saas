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
  Wallet, TrendingUp, Link as LinkIcon, Calendar, 
  Copy, ExternalLink, Plus, ArrowUpRight, ShieldCheck, 
  Loader2, MoreVertical, Zap
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [urls, setUrls] = useState([]);
  const [stats, setStats] = useState({ totalClicks: 0, todayEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);

  // Fake chart data for visual demo (You can connect this to real API later)
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/urls/my-urls');
      setUrls(data);
      
      // Calculate Stats
      const clicks = data.reduce((acc, curr) => acc + parseInt(curr.click_count || 0), 0);
      setStats({ 
        totalClicks: clicks, 
        todayEarnings: (clicks * 0.25).toFixed(2) // Estimate based on activity
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUrl) return;
    setCreating(true);
    try {
      const { data } = await api.post('/urls/shorten', { originalUrl: newUrl });
      toast.success('Link Shortened!');
      setUrls([data, ...urls]);
      setNewUrl('');
    } catch (error) {
      toast.error('Failed to create link');
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
      
      {/* TOP NAVIGATION */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-1">
                Panda<span className="text-green-600">Lime</span>
              </Link>
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Pro Account
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-slate-700">{user?.email}</span>
                <span className="text-xs text-slate-500">ID: {user?.id}</span>
              </div>
              <button 
                onClick={logout}
                className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* WELCOME HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Here's what's happening with your links today.</p>
          </div>
          <Link to="/payouts" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5">
            <Wallet size={18} /> Withdraw Funds
          </Link>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Balance (Trust Anchor) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={64} className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Balance</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              ₹{parseFloat(user?.wallet_balance || 0).toFixed(2)}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                <ArrowUpRight size={14} /> +12.5%
              </span>
              <span className="text-slate-400">vs last week</span>
            </div>
          </motion.div>

          {/* Card 2: Performance */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
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

          {/* Card 3: Quick Action (Create) */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" /> Create New Link
            </h3>
            <form onSubmit={handleCreate} className="relative">
              <input 
                type="url" 
                placeholder="Paste URL here..." 
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 transition-all"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button 
                disabled={creating}
                className="absolute right-2 top-2 p-1.5 bg-green-500 hover:bg-green-400 text-slate-900 rounded-lg transition-colors"
              >
                {creating ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus size={20} />}
              </button>
            </form>
          </motion.div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: CHART & TABLE (2/3 Width) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-800">Revenue Overview</h3>
                <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-1 focus:outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#4ade80' }}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Links List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-800">Recent Links</h3>
                <button className="text-sm text-green-600 font-bold hover:underline">View All</button>
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
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                          <LinkIcon size={20} />
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
                      
                      <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right mr-4">
                          <p className="text-xs font-bold text-slate-700">{url.click_count} clicks</p>
                          <p className="text-[10px] text-slate-400">Since {new Date(url.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        <button 
                          onClick={() => copyToClipboard(url.short_code)}
                          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-green-600 transition-all"
                          title="Copy Link"
                        >
                          <Copy size={18} />
                        </button>
                        <a 
                          href={url.original_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition-all"
                          title="Visit Original"
                        >
                          <ExternalLink size={18} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ALERTS & INFO (1/3 Width) */}
          <div className="space-y-6">
            
            {/* Account Status */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" /> Account Status
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Verification</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Verified</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Fraud Score</span>
                  <span className="text-green-600 font-bold">Low (0%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full w-[98%]"></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Your traffic quality is excellent.</p>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Zap size={18} fill="currentColor" /> Boost Earnings
              </h4>
              <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                Did you know? Sharing links on Telegram groups between 6 PM - 9 PM generates 40% higher CPM.
              </p>
              <button className="w-full py-2 bg-white text-blue-600 font-bold text-sm rounded-lg shadow-sm hover:bg-blue-100 transition-colors">
                View Strategy Guide
              </button>
            </div>

             {/* Support */}
             <div className="text-center p-4">
               <p className="text-sm text-slate-400">Need help with payouts?</p>
               <a href="mailto:support@pandalime.com" className="text-sm font-bold text-slate-600 hover:text-green-600">Contact Support</a>
             </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;