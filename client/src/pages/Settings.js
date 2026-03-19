import React, { useContext, useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Shield, Bell, Lock, CheckCircle, Loader2 } from 'lucide-react';

const Settings = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error'

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await updateProfile({ name });
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 sticky top-0 z-40 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-primary">Settings</h1>
          {status === 'success' && (
            <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={18} />
              <span className="text-sm font-bold">Changes Saved</span>
            </div>
          )}
        </header>

        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-10 md:mb-12 text-center md:text-left">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-accent rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-500/20 shrink-0">
                  {user?.name?.[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-primary">{user?.name}</h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base break-all">{user?.role} Account • {user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-1">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-1 border-2 border-slate-50 rounded-[1.5rem] focus-within:border-accent transition-all duration-300">
                      <div className="p-4 md:p-5 bg-slate-50 rounded-2xl border border-transparent transition group">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm group-hover:text-accent transition">
                            <User size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                            <input 
                              type="text" 
                              value={name} 
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-transparent font-bold text-primary outline-none"
                              placeholder="Your name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-1 border-2 border-slate-50 rounded-[1.5rem] opacity-60">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-transparent transition group">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm transition">
                            <Mail size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                            <p className="font-bold text-primary">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-1">Account Security</h3>
                  <div className="space-y-4">
                    <button type="button" className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between hover:border-accent/30 hover:bg-blue-50/10 transition group text-left">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 text-accent rounded-xl">
                          <Lock size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-primary">Change Password</p>
                          <p className="text-xs text-slate-500">Update your account security credentials</p>
                        </div>
                      </div>
                      <Shield size={20} className="text-slate-300 group-hover:text-accent transition" />
                    </button>
                    
                    <button type="button" className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between hover:border-accent/30 hover:bg-blue-50/10 transition group text-left">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 text-accent rounded-xl">
                          <Bell size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-primary">Notifications</p>
                          <p className="text-xs text-slate-500">Manage how you receive alerts and updates</p>
                        </div>
                      </div>
                      <Bell size={20} className="text-slate-300 group-hover:text-accent transition" />
                    </button>
                  </div>
                </section>

                <div className="pt-8 border-t border-slate-50 flex justify-center md:justify-start">
                  <button 
                    type="submit"
                    disabled={loading || name === user?.name}
                    className="w-full md:w-auto px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save All Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
