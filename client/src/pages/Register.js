import React, { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify API connectivity on mount
    console.log('Register component initialized. API Base:', api.defaults.baseURL);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    adminSecret: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminField, setShowAdminField] = useState(false);

  const { name, email, password, company, adminSecret } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(formData);
      if (res.user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500">Join PropVal GH secure network</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-red-100 italic">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none text-slate-900"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none text-slate-900"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none text-slate-900"
                placeholder="••••••••"
              />
            </div>
            {!showAdminField && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Company (Optional)</label>
                <input
                  type="text"
                  name="company"
                  value={company}
                  onChange={onChange}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none text-slate-900"
                  placeholder="Real Estate Group"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdminField(!showAdminField)}
                className="text-xs font-bold text-slate-400 hover:text-accent transition uppercase tracking-widest ml-1"
              >
                {showAdminField ? '- Hide Admin Options' : '+ Register as Administrator'}
              </button>

              {showAdminField && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2 ml-1">Admin Secret Code</label>
                  <input
                    type="password"
                    name="adminSecret"
                    value={adminSecret}
                    onChange={onChange}
                    className="w-full px-5 py-4 bg-red-50 border-none rounded-2xl focus:ring-2 focus:ring-red-400 transition outline-none text-slate-900"
                    placeholder="Enter Secret Code"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition active:scale-95 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Sign Up</span>
              )}
            </button>
          </form>

          <p className="text-center mt-10 text-slate-500 font-medium">
            Already have an account? <a href="/login" className="text-accent hover:underline decoration-2 underline-offset-4">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
