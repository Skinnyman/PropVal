import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Shield, Bell, Lock } from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-8 py-5 sticky top-0 z-40">
          <h1 className="text-2xl font-bold text-primary">Settings</h1>
        </header>

        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-10">
              <div className="flex items-center space-x-6 mb-12">
                <div className="w-24 h-24 bg-accent rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-500/20">
                  {user?.name?.[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-primary">{user?.name}</h2>
                  <p className="text-slate-500 font-medium">{user?.role} Account • {user?.email}</p>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-1">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition group">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:text-accent transition">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Full Name</p>
                          <p className="font-bold text-primary">{user?.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition group">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:text-accent transition">
                          <Mail size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Email Address</p>
                          <p className="font-bold text-primary">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-1">Account Security</h3>
                  <div className="space-y-4">
                    <button className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between hover:border-accent/30 hover:bg-blue-50/10 transition group text-left">
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
                    
                    <button className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between hover:border-accent/30 hover:bg-blue-50/10 transition group text-left">
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

                <div className="pt-8 border-t border-slate-50">
                  <button className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition active:scale-95">
                    Save All Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
