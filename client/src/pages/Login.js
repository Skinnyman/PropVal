import React, { useState, useContext, useEffect } from 'react';
//import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, clearUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify API connectivity on mount
    //console.log('Login component initialized. API Base:', api.defaults.baseURL);
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.user.role === 'Admin') {
        clearUser(); // Clear storage & state without hard redirect
        setError('INVALID CREDENTIALS.');
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900">
      <div className="max-w-md w-full bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-accent rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck size={36} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Secure Login</h2>
            <p className="text-slate-500 font-medium">Access your valuation intelligence</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100 flex items-center animate-shake">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium"
                placeholder="Email Address"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                required
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium"
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login securely</span>
              )}
            </button>
          </form>

          <div className="text-center mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">System Administrator?</p>
            <a href="/admin-login" className="text-slate-900 font-black hover:text-accent transition underline decoration-2 underline-offset-4">
              Access Admin Portal
            </a>
          </div>

          <div className="text-center mt-8 space-y-4">
            <p className="text-slate-400 font-bold text-sm tracking-wide">
              NEW TO PROPVAL GH?
            </p>
            <a href="/register" className="inline-block px-8 py-3 border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95">
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
