import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">Panda<span className="text-gray-900">Lime</span></div>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
          <Link to="/register" className="bg-primary hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Panda URL Shortener <br className="hidden md:block" />
          <span className="text-primary">Free Forever. Secure. Profitable.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          The most reliable way to shorten URLs and create custom bio links. 
          Includes powerful analytics, QR codes, and monetization tools — 100% free.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="bg-primary hover:bg-indigo-700 text-white text-lg px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-200">
            Start for Free
          </Link>
          <Link to="/login" className="bg-white text-gray-700 text-lg px-8 py-4 rounded-xl font-bold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
            Log in
          </Link>
        </div>
      </div>

      {/* Features Grid (Optional / Keep as is) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50 rounded-3xl mb-20">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
            <p className="text-gray-500">Redirects happen in milliseconds. No lag, no waiting.</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics Included</h3>
            <p className="text-gray-500">Track clicks, locations, and devices with our dashboard.</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Safe</h3>
            <p className="text-gray-500">All links are encrypted and protected against spam.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 text-center text-gray-400 text-sm">
        <p>© 2024 Panda URL Shortener. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;