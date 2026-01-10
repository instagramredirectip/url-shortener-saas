import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; 
// Added new icons for the features: Zap, BarChart3, Infinity, PenTool, ShieldCheck
import { Copy, Check, Loader2, LayoutDashboard, Volume2, VolumeX, Zap, BarChart3, Infinity as InfinityIcon, PenTool, ShieldCheck } from 'lucide-react';

const Home = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [shortLink, setShortLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  
  // Login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Video state
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!inputUrl) return;

    setLoading(true);
    setError(null);
    setShortLink(null);

    try {
      const { data } = await api.post('/urls/shorten', { originalUrl: inputUrl });
      const fullShortUrl = `https://go.pandalime.com/${data.short_code}`;
      setShortLink(fullShortUrl);
      setInputUrl('');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between w-full z-50 relative">
        <div className="text-2xl font-bold text-primary">Panda<span className="text-gray-900">Lime</span></div>
        
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <Link 
              to="/dashboard" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
              <Link to="/register" className="bg-primary hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">Sign up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center flex-grow">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Shorten URLs in <span className="text-primary">One Click.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          The most reliable way to create secure, trackable links. <br/>
          <span className="text-sm font-semibold text-indigo-500">Free Forever. No Credit Card Required.</span>
        </p>
        
        {/* Input Form */}
        <div className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl border border-gray-200 flex flex-col sm:flex-row gap-2 mb-8">
          <input 
            type="url" 
            placeholder="Paste your long link here..." 
            className="flex-1 px-6 py-4 rounded-xl text-gray-700 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            required
          />
          <button 
            onClick={handleShorten}
            disabled={loading}
            className="bg-primary hover:bg-indigo-700 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Shorten'}
          </button>
        </div>

        {/* Result Card */}
        {error && <p className="text-red-500 font-medium mb-6">{error}</p>}
        
        {shortLink && (
          <div className="max-w-xl mx-auto bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between gap-4 animate-fade-in-down mb-8">
            <a href={shortLink} target="_blank" rel="noreferrer" className="text-green-800 font-bold text-lg truncate hover:underline">
              {shortLink}
            </a>
            <button 
              onClick={copyToClipboard}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Conditional Link */}
        {!isLoggedIn && (
          <div className="text-sm text-gray-400 mb-12">
            Want custom names (e.g., /bubble) and analytics? <Link to="/register" className="text-primary hover:underline font-semibold">Create a free account</Link>.
          </div>
        )}

        {/* VIDEO SHOWCASE SECTION */}
        <div className="w-full max-w-5xl mx-auto mt-8 mb-24 px-2 sm:px-0">
          <div className="relative group rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white border border-gray-100 bg-gray-900 aspect-video transform hover:scale-[1.01] transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none"></div>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src="https://app.pandalime.com/showcasevid.mp4"
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
            <button
              onClick={toggleMute}
              className="absolute bottom-6 right-6 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white p-3 rounded-full transition-all duration-300 shadow-lg group-hover:bg-primary/90"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>

        {/* FEATURES MONTAGE (BENTO GRID) */}
        <div className="w-full max-w-6xl mx-auto px-4 mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Why Creators Choose PandaLime</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Fastest Generation (Large Card) */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-8 rounded-3xl text-left hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-64 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap size={120} className="text-primary" />
               </div>
               <div className="z-10 bg-white/80 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-primary shadow-sm">
                  <Zap size={24} />
               </div>
               <div className="z-10">
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Lightning Fast Generation</h3>
                 <p className="text-gray-500 font-medium">Instant short links. No loading screens, no ads, no waiting. Just paste and go.</p>
               </div>
            </div>

            {/* 2. Free Forever (Highlight Card) */}
            <div className="md:col-span-1 bg-gray-900 p-8 rounded-3xl text-left hover:-translate-y-1 transition-transform duration-300 shadow-lg flex flex-col justify-between h-64 text-white relative overflow-hidden">
               <div className="absolute -bottom-4 -right-4 opacity-10">
                  <ShieldCheck size={140} />
               </div>
               <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <ShieldCheck size={24} className="text-green-400" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold mb-2">Free Forever</h3>
                 <p className="text-gray-400 text-sm">We believe in free tools. No credit card required, ever.</p>
               </div>
            </div>

            {/* 3. Custom Links */}
            <div className="md:col-span-1 bg-white border border-gray-100 p-8 rounded-3xl text-left hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg flex flex-col h-64">
               <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mb-auto text-purple-600">
                  <PenTool size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Aliases</h3>
                 <p className="text-gray-500 text-sm">Brand your links. Use <span className="font-mono bg-gray-100 px-1 rounded">/your-brand</span> instead of random characters.</p>
               </div>
            </div>

            {/* 4. Unlimited Links */}
            <div className="md:col-span-1 bg-white border border-gray-100 p-8 rounded-3xl text-left hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg flex flex-col h-64">
               <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-auto text-emerald-600">
                  <InfinityIcon size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Unlimited Links</h3>
                 <p className="text-gray-500 text-sm">Create as many links as you need. We don't put caps on your creativity.</p>
               </div>
            </div>

            {/* 5. Free Analytics */}
            <div className="md:col-span-1 bg-white border border-gray-100 p-8 rounded-3xl text-left hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg flex flex-col h-64">
               <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-auto text-blue-600">
                  <BarChart3 size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Free Analytics</h3>
                 <p className="text-gray-500 text-sm">Track clicks, locations, and devices. Know your audience better.</p>
               </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full mt-auto">
        <div className="relative h-[300px] w-full overflow-hidden">
             {/* Using a gradient overlay to blend the footer image if needed */}
             <div className="absolute inset-0 bg-gray-900/10"></div>
             <img 
              src="https://i.pinimg.com/736x/07/a3/12/07a3127d57215a6ca2a5465cdd5d06ac.jpg" 
              alt="PandaLime Footer" 
              className="w-full h-full object-cover" 
            />
        </div>
        <div className="bg-gray-900 text-gray-400 py-6 text-center text-sm border-t border-gray-800">
           <div className="flex flex-col md:flex-row justify-center items-center gap-4">
              <span>© 2024 Panda URL Shortener. All rights reserved.</span>
              <span className="hidden md:inline text-gray-700">|</span>
              <div className="flex gap-4">
                  <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                  <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;