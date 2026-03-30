import React, { useState, useContext, useEffect } from 'react';
//import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify API connectivity on mount
    // console.log('Register component initialized. API Base:', api.defaults.baseURL);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, email, password, confirmPassword, company } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Password Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters and contain both letters and numbers (alphanumeric).');
      setLoading(false);
      return;
    }

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

  const calculateStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-100' };
    let score = 0;
    if (pass.length > 5) score++;
    if (pass.length >= 8) score++;
    if (/[a-zA-Z]/.test(pass) && /[0-9]/.test(pass)) score++;

    if (score === 1) return { score: 33, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 66, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
    return { score: 10, label: 'Very Weak', color: 'bg-red-400' };
  };

  const strength = calculateStrength(password);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 md:p-10">
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

              {/* Password Strength Indicator */}
              <div className="mt-3 px-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Security Strength</span>
                  <span className={`text-[10px] font-black uppercase ${strength.label === 'Strong' ? 'text-emerald-500' : strength.label === 'Fair' ? 'text-yellow-600' : 'text-red-500'}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${strength.color}`}
                    style={{ width: `${strength.score}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                  Use at least <span className="text-slate-900 font-bold">8 characters</span> with a mix of <span className="text-slate-900 font-bold">letters and numbers</span> (Alphanumeric).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none text-slate-900"
                placeholder="••••••••"
              />
            </div>
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

            {/* <p className="text-xs text-slate-400 font-medium px-1 pt-2">
              Are you an Administrator? <a href="/admin-register" className="text-slate-600 hover:text-accent font-bold transition">Register here</a>
            </p> */}

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
