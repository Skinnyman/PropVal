import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { login, forgotPassword, resetPassword, clearUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otpCode: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if ((view === 'otp' || view === 'reset') && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [view, timeLeft]);

  const { email, password, otpCode, newPassword } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmitLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      if (res.user.role === 'Admin') navigate('/admin');
      else {
        clearUser();
        setError('Access denied: Unauthorized account type for this portal.');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForgot = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await forgotPassword(email);
      setSuccess(res.msg);
      setView('reset');
      setTimeLeft(120);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error requesting reset');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitReset = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await resetPassword(email, otpCode, newPassword);
      setSuccess(res.msg);
      setView('login');
      setFormData(prev => ({ ...prev, password: '', otpCode: '', newPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.msg || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="max-w-md w-full bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-8">
            <button
              onClick={() => navigate('/login')}
              className="p-2 text-slate-400 hover:text-primary transition bg-slate-50 rounded-xl"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-slate-100">
              <ShieldCheck size={36} />
            </div>
            <div className="w-10"></div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {view === 'login' && 'Admin Portal'}
              {view === 'forgot' && 'Forgot Password'}
              {view === 'reset' && 'Reset Password'}
            </h2>
            <p className="text-slate-500 font-medium">
              {view === 'login' && 'System Administration Login'}
              {view === 'forgot' && 'Request an admin verification code'}
              {view === 'reset' && 'Update your admin password'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100 flex items-center italic">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-emerald-100 flex items-center">
              <span className="mr-2">✔️</span> {success}
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={onSubmitLogin} className="space-y-6">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition duration-200" size={20} />
                <input type="email" name="email" value={email} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900/10 focus:ring-4 focus:ring-slate-950/5 transition-all outline-none text-slate-900 font-medium" placeholder="Admin Email" />
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition duration-200" size={20} />
                <input type="password" name="password" value={password} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900/10 focus:ring-4 focus:ring-slate-950/5 transition-all outline-none text-slate-900 font-medium" placeholder="Password" />
              </div>

              <div className="text-right">
                <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition outline-none">Forgot Password?</button>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-2xl shadow-slate-950/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Verifying...</span></> : <span>Access Dashboard</span>}
              </button>
            </form>
          )}



          {view === 'forgot' && (
            <form onSubmit={onSubmitForgot} className="space-y-6">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition duration-200" size={20} />
                <input type="email" name="email" value={email} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900/10 focus:ring-4 focus:ring-slate-950/5 transition-all outline-none text-slate-900 font-medium" placeholder="Registered Admin Email" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-2xl shadow-slate-950/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Sending...</span></> : <span>Send Reset Code</span>}
              </button>
              <button type="button" onClick={() => setView('login')} className="w-full py-3 text-slate-500 font-bold outline-none hover:underline">Back to Login</button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={onSubmitReset} className="space-y-6">
              <div className="text-center mb-4">
                {timeLeft > 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    Code expires in <span className="text-red-500">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-red-500">
                    Code has expired. Please request a new one.
                  </p>
                )}
              </div>
              <div className="relative group">
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition duration-200" size={20} />
                <input type="text" name="otpCode" value={otpCode} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900/10 focus:ring-4 focus:ring-slate-950/5 transition-all outline-none text-slate-900 font-medium tracking-widest text-center text-lg" placeholder="Reset Code (123456)" maxLength={6} disabled={timeLeft === 0} />
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition duration-200" size={20} />
                <input type="password" name="newPassword" value={newPassword} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900/10 focus:ring-4 focus:ring-slate-950/5 transition-all outline-none text-slate-900 font-medium" placeholder="New Password" disabled={timeLeft === 0} />
              </div>
              <button type="submit" disabled={loading || timeLeft === 0} className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-2xl shadow-slate-950/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Resetting...</span></> : <span>Update Password</span>}
              </button>
              <button type="button" onClick={() => setView('login')} className="w-full py-3 text-slate-500 font-bold outline-none hover:underline">Cancel</button>
            </form>
          )}

          {view === 'login' && (
            <div className="text-center mt-12">
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                Authorized Personnel Only
              </p>
              <a href="/admin-register" className="mt-4 inline-block text-slate-500 font-bold hover:text-slate-900 transition underline decoration-2 underline-offset-4">
                Register New Admin
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
