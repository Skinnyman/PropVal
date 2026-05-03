import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, verifyOtp, forgotPassword, resetPassword, clearUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [view, setView] = useState('login'); // 'login', 'otp', 'forgot', 'reset'
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
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
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
      // Wait, if an admin login happens on the public portal, maybe we clear it... 
      // Actually let's assume they continue with OTP
      if (res.requireOtp) {
        setSuccess(res.msg || 'OTP sent to your email.');
        setView('otp');
        setTimeLeft(120);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials');
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
      if (res.user.role === 'Admin') {
        clearUser();
        setError('Administrators must use the admin portal.');
        setView('login');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid OTP');
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900">
      <div className="max-w-md w-full bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-accent rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck size={36} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {view === 'login' && 'Secure Login'}
              {view === 'otp' && 'Verify Identity'}
              {view === 'forgot' && 'Forgot Password'}
              {view === 'reset' && 'Reset Password'}
            </h2>
            <p className="text-slate-500 font-medium">
              {view === 'login' && 'Access your valuation intelligence'}
              {view === 'otp' && 'Please enter the code sent to your email'}
              {view === 'forgot' && 'Enter your email to receive a reset code'}
              {view === 'reset' && 'Enter your reset code and new password'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100 flex items-center animate-shake">
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
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
                <input type="email" name="email" value={email} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium" placeholder="Email Address" />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
                <input type="password" name="password" value={password} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium" placeholder="Password" />
              </div>

              <div className="text-right">
                <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} className="text-sm font-bold text-slate-500 hover:text-accent transition outline-none">Forgot Password?</button>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Authenticating...</span></> : <span>Login securely</span>}
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
                    Code has expired. Please request a new one.
                  </p>
                )}
              </div>

              <div className="relative group">
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
                <input type="text" name="otpCode" value={otpCode} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium tracking-widest text-center text-lg" placeholder="123456" maxLength={6} disabled={timeLeft === 0} />
              </div>

              <button type="submit" disabled={loading || timeLeft === 0} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Verifying...</span></> : <span>Verify Code</span>}
              </button>
              <button type="button" onClick={() => setView('login')} className="w-full py-3 text-slate-500 font-bold outline-none hover:underline">Cancel</button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={onSubmitForgot} className="space-y-6">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
                <input type="email" name="email" value={email} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium" placeholder="Enter your registered email" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed">
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
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
                <input type="text" name="otpCode" value={otpCode} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium tracking-widest text-center text-lg" placeholder="Reset Code (123456)" maxLength={6} disabled={timeLeft === 0} />
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition duration-200" size={20} />
                <input type="password" name="newPassword" value={newPassword} onChange={onChange} required className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent/20 focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-medium" placeholder="New Password" disabled={timeLeft === 0} />
              </div>

              <button type="submit" disabled={loading || timeLeft === 0} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="animate-spin" size={24} /><span>Resetting...</span></> : <span>Update Password</span>}
              </button>
              <button type="button" onClick={() => setView('login')} className="w-full py-3 text-slate-500 font-bold outline-none hover:underline">Cancel</button>
            </form>
          )}

          {view === 'login' && (
            <div className="text-center mt-8 space-y-4">
              <p className="text-slate-400 font-bold text-sm tracking-wide">
                NEW TO PROPVAL GH?
              </p>
              <a href="/register" className="inline-block px-8 py-3 border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95">
                Create an account
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
