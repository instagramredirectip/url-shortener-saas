import { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    setLoading(true);
    try {
      const payload = { email: formData.email, password: formData.password };
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('token', data.token);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
           <Link to="/" className="flex items-center gap-2 mb-8 group w-fit">
             <div className="bg-green-600 text-white p-2 rounded-lg group-hover:bg-slate-900 transition-colors">
                <Zap size={24} fill="currentColor" />
             </div>
             <span className="text-2xl font-black text-slate-900 tracking-tighter">Panda<span className="text-green-600">Lime</span></span>
          </Link>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-slate-500">
            Start earning passive income in less than 2 minutes.
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="you@example.com"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="Create a password"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="Repeat password"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-green-200 text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-70 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Create Free Account'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-slate-900 hover:text-green-600 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: FEATURES (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-center p-12 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-600 rounded-full blur-[120px] opacity-20"></div>

        <div className="relative z-10 max-w-md mx-auto">
          <h3 className="text-3xl font-bold mb-8">Why join 50,000+ creators?</h3>
          
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Highest CPM Rates</h4>
                <p className="text-slate-400 text-sm">We optimize ads specifically for Indian traffic to maximize your earnings.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
               <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Daily UPI Payouts</h4>
                <p className="text-slate-400 text-sm">Get paid within 24 hours directly to your bank or GPay.</p>
              </div>
            </li>
             <li className="flex items-start gap-4">
               <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Smart Anti-Adblock</h4>
                <p className="text-slate-400 text-sm">Our technology ensures you get paid for every valid view.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
};

export default Register;