import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, ShieldCheck, Key, KeyRound } from 'lucide-react';

const AdminRegister = () => {
  const { register, verifyOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const [view, setView] = useState('register'); // 'register' or 'otp'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecret: '',
    otpCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (view === 'otp' && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [view, timeLeft]);

  const { name, email, password, confirmPassword, adminSecret, otpCode } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Auth Validation
    if (!adminSecret) {
      setError('Admin Secret Code is required for registration.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters and alphanumeric (letters & numbers).');
      setLoading(false);
      return;
    }

    try {
      const res = await register(formData);
      if (res.requireOtp) {
        setSuccess('OTP sent to your email. Please verify.');
        setView('otp');
        setTimeLeft(120);
      } else {
        if (res.user.role === 'Admin') navigate('/admin');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitOtp = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(email, otpCode);
      if (res.user.role === 'Admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid OTP');
    } finally {
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-10 md:p-12">
          <button
            onClick={() => navigate('/admin-login')}
            className="mb-8 p-2 text-slate-400 hover:text-primary transition bg-slate-50 rounded-xl inline-flex items-center space-x-2 font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </button>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-6">
              <ShieldCheck size={36} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {view === 'register' ? 'Admin Signup' : 'Verify Email'}
            </h2>
            <p className="text-slate-500 font-medium">
              {view === 'register' ? 'Establish administrative authority' : 'Enter the code sent to your official email'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100 italic">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-8 text-sm font-medium border border-emerald-100">
              {success}
            </div>
          )}

          {view === 'register' && (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Legal Name</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={onChange}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900 transition outline-none text-slate-900 font-bold"
                  placeholder="Administrator Name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Official Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900 transition outline-none text-slate-900 font-bold"
                  placeholder="admin@propval.gh"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Choose Password</label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900 transition outline-none text-slate-900 font-bold"
                  placeholder="••••••••"
                />

                {/* Strength Meter */}
                <div className="mt-3 px-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Security Grade</span>
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
                    Requirement: <span className="text-slate-900 font-bold">Alphanumeric</span> (A-Z + 0-9), min 8 chars.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900 transition outline-none text-slate-900 font-bold"
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-2 ml-1">
                  <Key size={12} className="mr-1" /> System Secret Key
                </label>
                <input
                  type="password"
                  name="adminSecret"
                  value={adminSecret}
                  onChange={onChange}
                  required
                  className="w-full px-6 py-4 bg-red-50/50 border-2 border-dashed border-red-100 rounded-2xl focus:ring-2 focus:ring-red-400 transition outline-none text-slate-900 font-black placeholder:text-red-200"
                  placeholder="Enter Creation Secret"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-900/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2"
              >
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Initializing...</span></> : <span>Register Administrator</span>}
              </button>
            </form>
          )}

          {view === 'otp' && (
            <form onSubmit={onSubmitOtp} className="space-y-6">
              <div className="text-center mb-4">
                {timeLeft > 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    Code expires in <span className="text-red-500">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-red-500">
                    Code has expired. Please register again.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Verification Code</label>
                <div className="relative group">
                  <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition duration-200" size={20} />
                  <input type="text" name="otpCode" value={otpCode} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900 transition outline-none text-slate-900 font-medium tracking-widest text-center text-lg" placeholder="123456" maxLength={6} disabled={timeLeft === 0} />
                </div>
              </div>
              <button type="submit" disabled={loading || timeLeft === 0} className="w-full mt-6 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-900/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2">
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Verifying...</span></> : <span>Verify Admin Account</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
