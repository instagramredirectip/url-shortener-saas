import { Link } from 'react-router-dom';
import { Zap, Shield, BarChart3, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">URL Shortener</div>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Log in</Link>
          <Link to="/register" className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Shorten Links. <br className="hidden md:block" />
          <span className="text-primary">Expand Your Reach.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          A powerful, privacy-focused URL shortener for modern businesses. 
          Track clicks, manage links, and boost your brand with our premium tools.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
            Start for Free <ArrowRight size={20} />
          </Link>
          <Link to="/login" className="px-8 py-4 rounded-xl text-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
            Dashboard
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-500">
                Our optimized redirection engine ensures your users never wait. 
                Global edge caching comes standard.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-500">
                Know who clicks your links. Track location, device type, and referral sources in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Security</h3>
              <p className="text-gray-500">
                HTTPS encryption, spam protection, and 99.9% uptime SLA. Your data is safe with us.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-gray-400">
        &copy; {new Date().getFullYear()} URL Shortener SaaS. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;