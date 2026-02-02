import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; 
import { 
  Copy, Check, Loader2, LayoutDashboard, Volume2, VolumeX, 
  Zap, BarChart3, Infinity as InfinityIcon, ShieldCheck, 
  TrendingUp, IndianRupee, Users, Star, ArrowRight, Menu, X 
} from 'lucide-react';

const Home = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [shortLink, setShortLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Video state
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  
  // Mobile Menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* LIVE PAYOUT TICKER (Psychology Hack: Social Proof) */}
      <div className="bg-green-600 text-white text-xs md:text-sm py-2 overflow-hidden whitespace-nowrap relative z-50">
        <marquee className="inline-block animate-marquee px-4">
          <span className="mx-4">🔥 <b>Rohan K.</b> just withdrew <b>₹1,200</b> via UPI</span>
          <span className="mx-4">🚀 <b>Priya S.</b> earned <b>₹450</b> from Instagram</span>
          <span className="mx-4">💸 <b>Amit B.</b> received <b>₹3,400</b> via GPay</span>
          <span className="mx-4">🔥 <b>Total Payouts Today:</b> ₹34,500+</span>
        </marquee>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="text-2xl font-extrabold text-slate-800 tracking-tighter flex items-center gap-1">
            <span className="text-green-600">Panda</span>Lime
            <div className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 border border-green-200">BETA</div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-green-600 font-medium text-sm">Earn Money</a>
            <a href="#payment" className="text-gray-600 hover:text-green-600 font-medium text-sm">Payment Proof</a>
            {isLoggedIn ? (
              <Link 
                to="/dashboard" 
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-slate-600 hover:text-slate-900 font-bold">Login</Link>
                <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-0.5">
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 flex flex-col gap-4 shadow-xl absolute w-full">
            <Link to="/login" className="text-center py-2 font-bold text-gray-700">Login</Link>
            <Link to="/register" className="text-center py-3 bg-green-600 text-white rounded-xl font-bold">Start Earning</Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <div className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-full mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-sm font-bold text-orange-700">India's Highest Paying Link Shortener</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Turn Your Links Into <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Passive Income.</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Shorten URLs for free <b>OR</b> monetize them to earn up to <span className="text-slate-900 font-bold bg-yellow-100 px-1">₹500/1000 views</span>. 
            Instant withdrawals via UPI & GPay.
          </p>
          
          {/* Main Action Form */}
          <div className="max-w-3xl mx-auto bg-white p-3 rounded-2xl shadow-2xl shadow-green-900/10 border border-gray-200 flex flex-col sm:flex-row gap-3 mb-8 transform hover:scale-[1.01] transition-transform duration-300">
            <input 
              type="url" 
              placeholder="Paste long URL here (e.g., Instagram Reel, YouTube)..." 
              className="flex-1 px-6 py-4 rounded-xl text-slate-700 text-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 border-transparent transition-all"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <button 
              onClick={handleShorten}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 min-w-[160px]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Shorten <Zap size={20} className="fill-yellow-400 text-yellow-400" /></>}
            </button>
          </div>

          {/* Result Area */}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg max-w-lg mx-auto mb-6 border border-red-100">{error}</div>}
          
          {shortLink && (
            <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-down mb-12 shadow-sm">
              <a href={shortLink} target="_blank" rel="noreferrer" className="text-green-800 font-bold text-lg truncate hover:underline px-2">
                {shortLink}
              </a>
              <button 
                onClick={copyToClipboard}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-green-200"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-400">
            <span className="flex items-center gap-1"><Check size={16} className="text-green-500" /> No Credit Card</span>
            <span className="flex items-center gap-1"><Check size={16} className="text-green-500" /> Instant Setup</span>
            <span className="flex items-center gap-1"><Check size={16} className="text-green-500" /> UPI/GPay</span>
          </div>
        </div>
      </div>

      {/* VIDEO SECTION (Preserved) */}
      <div className="w-full max-w-5xl mx-auto px-4 mb-24 -mt-10 relative z-20">
        <div className="relative group rounded-3xl overflow-hidden shadow-2xl ring-8 ring-white/50 bg-slate-900 aspect-video transform hover:scale-[1.01] transition-transform duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none"></div>
          <video
            ref={videoRef}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            src="https://app.pandalime.com/showcasevid.mp4"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          />
          <button
            onClick={toggleMute}
            className="absolute bottom-6 right-6 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-3 rounded-full transition-all duration-300"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className="absolute bottom-6 left-6 z-20 text-white">
            <p className="font-bold text-lg">See how it works</p>
            <p className="text-sm text-gray-300">Watch the monetization demo</p>
          </div>
        </div>
      </div>

      {/* DUAL MODE EXPLAINER (The "Legit" Hack) */}
      <div className="bg-white py-20 border-y border-gray-100" id="features">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">One Tool. Two Superpowers.</h2>
            <p className="text-lg text-slate-500">Choose how you want to use PandaLime.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mode 1: Normal */}
            <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-100 hover:border-slate-300 transition-colors">
              <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center mb-6 text-slate-700">
                <InfinityIcon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Free Shortener</h3>
              <p className="text-slate-500 mb-6">Just want a short link? No problem.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex gap-3 text-slate-600"><Check size={20} className="text-green-500" /> <b>No Ads</b> for visitors</li>
                <li className="flex gap-3 text-slate-600"><Check size={20} className="text-green-500" /> Unlimited clicks</li>
                <li className="flex gap-3 text-slate-600"><Check size={20} className="text-green-500" /> Basic Analytics</li>
              </ul>
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-100">
                Use for Free
              </button>
            </div>

            {/* Mode 2: Earner (Highlight) */}
            <div className="p-8 rounded-3xl bg-green-50 border-2 border-green-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">RECOMMENDED</div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                <IndianRupee size={32} />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-3">Earn Money</h3>
              <p className="text-green-700 mb-6">Monetize your audience with 1 click.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex gap-3 text-green-800"><Check size={20} className="text-green-600" /> <b>Highest CPM</b> in India</li>
                <li className="flex gap-3 text-green-800"><Check size={20} className="text-green-600" /> Daily UPI Withdrawals</li>
                <li className="flex gap-3 text-green-800"><Check size={20} className="text-green-600" /> Smart Ad Formats</li>
              </ul>
              <Link to="/register" className="block text-center w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200">
                Start Earning Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT TRUST SECTION (The "Indian Context" Hack) */}
      <div className="py-16 bg-slate-50" id="payment">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Get Paid Instantly via Your Favorite Apps</h2>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-center gap-12">
            
            {/* GPay */}
            <div className="flex flex-col items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
               <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-pay-icon.png" alt="Google Pay" className="h-16 w-auto" />
               <span className="font-bold text-slate-600">Google Pay</span>
            </div>

            <div className="hidden md:block w-px h-16 bg-slate-200"></div>

            {/* UPI */}
            <div className="flex flex-col items-center gap-3">
               <div className="h-16 w-24 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                  <span className="text-2xl font-black text-slate-700">UPI</span>
               </div>
               <span className="font-bold text-slate-600">Any UPI App</span>
            </div>

             <div className="hidden md:block w-px h-16 bg-slate-200"></div>

             {/* Bank */}
             <div className="flex flex-col items-center gap-3">
               <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <IndianRupee size={28} />
               </div>
               <span className="font-bold text-slate-600">Bank Transfer</span>
            </div>

          </div>
          <p className="mt-6 text-slate-500 text-sm">Minimum withdrawal is just <span className="font-bold text-slate-900">₹700</span>. No hidden fees.</p>
        </div>
      </div>

      {/* CASE STUDIES (The "How To" Hack) */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center text-slate-900 mb-12">Who is making money with us?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all">
               <div className="text-pink-600 mb-4 bg-pink-100 w-fit p-2 rounded-lg"><Users size={24} /></div>
               <h3 className="font-bold text-lg mb-2">Instagram Pages</h3>
               <p className="text-slate-500 text-sm">Review/Meme pages putting links in bio or stories. <br/><span className="text-green-600 font-bold">Avg: ₹15,000/mo</span></p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all">
               <div className="text-blue-600 mb-4 bg-blue-100 w-fit p-2 rounded-lg"><Zap size={24} /></div>
               <h3 className="font-bold text-lg mb-2">Telegram Groups</h3>
               <p className="text-slate-500 text-sm">Sharing movie/tech links. High click volume strategy. <br/><span className="text-green-600 font-bold">Avg: ₹45,000/mo</span></p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all">
               <div className="text-red-600 mb-4 bg-red-100 w-fit p-2 rounded-lg"><Volume2 size={24} /></div>
               <h3 className="font-bold text-lg mb-2">YouTubers</h3>
               <p className="text-slate-500 text-sm">Download links in description box. Passive income. <br/><span className="text-green-600 font-bold">Avg: ₹25,000/mo</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF / REVIEWS */}
      <div className="py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Don't just take our word for it.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Review 1 */}
            <div className="bg-slate-800 p-6 rounded-2xl relative">
               <div className="flex text-yellow-400 mb-4"><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/></div>
               <p className="text-slate-300 italic mb-6">"Bro, honestly the best part is UPI payment. Other sites make you wait for PayPal. Here I get GPay in 2 hours."</p>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold">R</div>
                 <div>
                   <p className="font-bold">Rahul Verma</p>
                   <p className="text-xs text-slate-400">Telegram Admin</p>
                 </div>
               </div>
            </div>

            {/* Review 2 */}
            <div className="bg-slate-800 p-6 rounded-2xl relative">
               <div className="flex text-yellow-400 mb-4"><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/></div>
               <p className="text-slate-300 italic mb-6">"My previous shortener stole my clicks. PandaLime analytics match my own tracking. Legit site."</p>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center font-bold">S</div>
                 <div>
                   <p className="font-bold">Sneha K.</p>
                   <p className="text-xs text-slate-400">Insta Influencer</p>
                 </div>
               </div>
            </div>

            {/* Review 3 */}
            <div className="bg-slate-800 p-6 rounded-2xl relative">
               <div className="flex text-yellow-400 mb-4"><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/></div>
               <p className="text-slate-300 italic mb-6">"CPM is fluctuating but consistently higher than others for Indian traffic. Good support on email."</p>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">A</div>
                 <div>
                   <p className="font-bold">Arjun Singh</p>
                   <p className="text-xs text-slate-400">Tech Blogger</p>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-green-600">Panda</span>Lime
              </h2>
              <p className="text-slate-500 text-sm max-w-xs mb-4">
                The most transparent and high-paying URL shortener built for the modern creator economy.
              </p>
              <div className="text-sm font-semibold text-slate-700">
                Support: <a href="mailto:microapkdeveloper@gmail.com" className="text-green-600">microapkdeveloper@gmail.com</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/login" className="hover:text-green-600">Login</Link></li>
                <li><Link to="/register" className="hover:text-green-600">Sign Up</Link></li>
                <li><a href="#payment" className="hover:text-green-600">Payout Rates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/terms" className="hover:text-green-600">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-green-600">Privacy Policy</Link></li>
                <li><Link to="/about" className="hover:text-green-600">About Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 text-center text-sm text-slate-400">
            © 2024 PandaLime. All rights reserved. Made with ❤️ in India.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;