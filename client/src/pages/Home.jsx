import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; 
import { Copy, Check, Loader2 } from 'lucide-react';

// FIX: Removed the local image import that was causing the crash
// import footerImg from '../assets/footer.png'; 

const Home = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [shortLink, setShortLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between w-full">
        <div className="text-2xl font-bold text-primary">Panda<span className="text-gray-900">Lime</span></div>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
          <Link to="/register" className="bg-primary hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center flex-grow">
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

        <div className="text-sm text-gray-400">
          Want custom names (e.g., /bubble) and analytics? <Link to="/register" className="text-primary hover:underline font-semibold">Create a free account</Link>.
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 rounded-3xl mb-12">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
            <p className="text-gray-500">Redirects happen in milliseconds. No lag.</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics</h3>
            <p className="text-gray-500">Track clicks and location data easily.</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">💰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Monetization</h3>
            <p className="text-gray-500">Earn revenue with our smart ad integration.</p>
          </div>
        </div>
      </div>

      {/* Footer Image - USING PLACEHOLDER TO FIX BUILD */}
      <footer className="w-full mt-auto">
        <img 
          src="https://i.pinimg.com/736x/07/a3/12/07a3127d57215a6ca2a5465cdd5d06ac.jpg" 
          alt="PandaLime Footer" 
          className="w-full h-auto object-cover max-h-[400px]" 
        />
        <div className="bg-gray-900 text-gray-400 py-4 text-center text-sm">
           © 2024 Panda URL Shortener. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;