import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- IMPORT THIS
import { Loader2, Mail, Lock, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Get the login function from Context
  const { login } = useAuth(); 

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Use the Context function (Handles State + Token + Headers automatically)
    const success = await login(formData.email, formData.password);

    if (success) {
      // Navigate ONLY after state is updated
      navigate('/dashboard');
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 group w-fit">
             <div className="bg-slate-900 text-white p-2 rounded-lg group-hover:bg-green-600 transition-colors">
                <ShieldCheck size={24} />
             </div>
             <span className="text-2xl font-black text-slate-900 tracking-tighter">Panda<span className="text-green-600">Lime</span></span>
          </Link>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-slate-500">
            Enter your details to access your earnings dashboard.
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <a href="#" className="text-sm font-medium text-green-600 hover:text-green-500">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-all transform hover:-translate-y-0.5"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to PandaLime?{' '}
            <Link to="/register" className="font-bold text-green-600 hover:text-green-500 transition-colors">
              Create free account
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: VISUALS */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-green-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>

        <div className="relative z-10 mt-auto mb-auto">
          <div className="bg-white/10 backdrop-blur-lg border border-white/10 p-6 rounded-2xl max-w-sm mx-auto shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
             <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                   <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                   <p className="text-xs text-gray-300">Total Earnings</p>
                   <p className="text-xl font-bold">₹12,450.00</p>
                </div>
             </div>
             <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded w-3/4"></div>
                <div className="h-2 bg-white/10 rounded w-1/2"></div>
             </div>
          </div>
          
          <div className="mt-12 text-center max-w-md mx-auto">
             <h3 className="text-2xl font-bold mb-3">Track every click.</h3>
             <p className="text-slate-400">
               Real-time analytics and instant payout processing via UPI and Google Pay.
             </p>
          </div>
        </div>

        <div className="relative z-10 text-center text-xs text-slate-500">
          © 2024 PandaLime Inc. Secure Login.
        </div>
      </div>

    </div>
  );
};

export default Login;