import { Link } from 'react-router-dom';
import { Users, Heart, Zap, ArrowLeft, Mail } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-600">
      
      {/* Hero */}
      <div className="bg-slate-900 text-white pt-20 pb-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            We Help Creators <span className="text-green-500">Earn More.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            PandaLime was built with a simple mission: To empower Indian creators, students, and influencers to monetize their traffic easily and transparently.
          </p>
        </div>
      </div>

      {/* Mission Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20 -mt-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Community First</h3>
            <p>We understand the Indian market. That's why we prioritized UPI & GPay withdrawals from Day 1.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast</h3>
            <p>Our technology ensures your links load instantly, anywhere in the world, even on slower networks.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="bg-pink-100 w-12 h-12 rounded-xl flex items-center justify-center text-pink-600 mb-6">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent</h3>
            <p>No hidden fees. No "shaving" clicks. You get paid for every valid view your content generates.</p>
          </div>
        </div>
      </div>

      {/* Story / Contact */}
      <div className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
        <p className="text-lg mb-12 leading-relaxed">
          Founded in 2024, PandaLime started as a small project to help a few Telegram admins monetize their channels. 
          Today, we serve thousands of users across India, processing millions of clicks daily. 
          We are committed to building the most reliable URL shortener in the industry.
        </p>

        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 inline-block w-full">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Get in Touch</h3>
          <p className="text-slate-500 mb-6">Have a question or need support? We respond within 24 hours.</p>
          <a 
            href="mailto:microapkdeveloper@gmail.com" 
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all"
          >
            <Mail size={20} /> microapkdeveloper@gmail.com
          </a>
        </div>
      </div>

    </div>
  );
};

export default About;