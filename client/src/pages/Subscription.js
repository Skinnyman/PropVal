import React, { useContext, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { Check, Zap, Crown, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import api from '../services/api';

const Subscription = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/initialize-payment', { plan });
      // Redirect to mock Paystack URL
      window.location.href = res.data.authorization_url;
    } catch (err) {
      console.error('Payment initialization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 sticky top-0 z-40">
          <h1 className="text-xl md:text-2xl font-bold text-primary">Subscription Plan</h1>
        </header>

        <div className="p-4 md:p-12 max-w-6xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-black uppercase tracking-widest mb-6">
            Membership Plans
          </div>
          <h2 className="text-5xl font-black text-primary mb-6">Scale Your Valuation Practice</h2>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto mb-16 px-4">
            Get access to the most comprehensive property database in Ghana and professional automation tools.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl border-2 border-transparent relative overflow-hidden transition hover:shadow-2xl">
              <div className="flex justify-between items-start mb-8 text-left">
                <div>
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-primary">Free Tier</h3>
                  <p className="text-slate-400 font-bold">Observer Access</p>
                </div>
                <div className="text-3xl font-black text-primary">GHS 0<span className="text-sm font-medium text-slate-400">/mo</span></div>
              </div>

              <ul className="space-y-4 mb-10 text-left">
                <li className="flex items-center text-slate-500 font-medium">
                  <Check size={18} className="text-emerald-500 mr-3" />
                  Grid View Data Explorer
                </li>
                <li className="flex items-center text-slate-500 font-medium">
                  <Check size={18} className="text-emerald-500 mr-3" />
                  Search Basic Filters
                </li>
                <li className="flex items-center text-slate-300 font-medium line-through">
                  <Lock size={16} className="mr-3" />
                  Map-based Intelligence
                </li>
                <li className="flex items-center text-slate-300 font-medium line-through">
                  <Lock size={16} className="mr-3" />
                  Automated Valuation Workspace
                </li>
              </ul>

              <button
                disabled={user?.subscriptionStatus === 'Free'}
                className="w-full py-5 rounded-3xl font-black border-2 border-slate-100 text-slate-400 disabled:bg-slate-50 transition"
              >
                {user?.subscriptionStatus === 'Free' ? 'Current Plan' : 'Downgrade'}
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl border-4 border-accent relative overflow-hidden transition hover:scale-[1.02]">
              <div className="absolute top-0 right-0 bg-accent text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest">
                Recommended
              </div>
              <div className="flex justify-between items-start mb-8 text-left">
                <div>
                  <div className="w-14 h-14 bg-blue-50 text-accent rounded-2xl flex items-center justify-center mb-4">
                    <Crown size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-primary">Professional</h3>
                  <p className="text-accent font-black">Full Power</p>
                </div>
                <div className="text-3xl font-black text-primary">GHS 499<span className="text-sm font-medium text-slate-400">/mo</span></div>
              </div>

              <ul className="space-y-4 mb-10 text-left">
                <li className="flex items-center text-slate-700 font-bold">
                  <Check size={18} className="text-accent mr-3" />
                  Full Database Access
                </li>
                <li className="flex items-center text-slate-700 font-bold">
                  <Check size={18} className="text-accent mr-3" />
                  Interactive Map Explorer
                </li>
                <li className="flex items-center text-slate-700 font-bold">
                  <Check size={18} className="text-accent mr-3" />
                  Automated Valuation Engine
                </li>
                <li className="flex items-center text-slate-700 font-bold">
                  <Check size={18} className="text-accent mr-3" />
                  Professional PDF Reports
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade('professional')}
                disabled={loading || user?.subscriptionStatus === 'Professional'}
                className="w-full py-5 bg-accent text-white rounded-3xl font-black shadow-xl shadow-blue-500/20 hover:bg-opacity-90 transition flex items-center justify-center space-x-2"
              >
                {loading ? 'Initializing...' : user?.subscriptionStatus === 'Professional' ? 'Active Plan' : (
                  <>
                    <CreditCard size={20} />
                    <span>Upgrade with Paystack</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-20 flex flex-col items-center">
            <div className="flex items-center space-x-6 mb-10">
              <ShieldCheck size={32} className="text-slate-300" />
              <p className="text-slate-400 font-bold">Secure payments powered by Paystack</p>
            </div>
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100"></div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100"></div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Subscription;
