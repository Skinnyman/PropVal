import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  ArrowUpRight,
  Users,
  Search,
  MapPin,
  ShieldAlert
} from 'lucide-react';

const Dashboard = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Total Valuations', value: '0', change: '+0', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Saved Comparables', value: '0', change: '+0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Market Transactions', value: '0', change: '+0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]);
  const [recentValuations, setRecentValuations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fixed useEffect
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        await refreshUser(); // Refresh user to get latest savedProperties

        const [valuationsRes, propertiesRes] = await Promise.all([
          api.get('/valuations'),
          api.get('/properties')
        ]);

        const valuations = Array.isArray(valuationsRes.data) ? valuationsRes.data : [];
        const properties = Array.isArray(propertiesRes.data) ? propertiesRes.data : [];

        setStats([
          {
            label: 'Total Valuations',
            value: valuations.length.toString(),
            change: `+${valuations.length > 0 ? valuations.length : 0}`,
            icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50'
          },
          {
            label: 'Saved Comparables',
            value: (user?.savedProperties?.length || 0).toString(),
            change: '+0',
            icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50'
          },
          {
            label: 'Market Transactions',
            value: properties.length.toString(),
            change: `+${properties.length}`,
            icon: Users, color: 'text-purple-600', bg: 'bg-purple-50'
          },
        ]);

        setRecentValuations(valuations.slice(0, 3));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.savedProperties?.length, refreshUser]); // ✅ Correct dependencies

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl md:text-2xl font-bold text-primary">Overview</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search properties..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent w-64 transition"
              />
            </div>
            <div className="w-10 h-10 bg-accent rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Welcome section */}
          <div className="mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mb-2">Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</h2>
            <p className="text-slate-500">Here's a summary of your property valuation activity this month.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center">
                    <ArrowUpRight size={12} className="mr-1" /> {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
                  <h4 className="text-3xl font-bold text-primary mt-1">{stat.value}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions / Recent Valuations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-primary">Recent Valuations</h3>
                <button className="text-accent text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : recentValuations.length > 0 ? (
                  recentValuations.map((val) => (
                    <div key={val._id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <h5 className="font-bold text-primary">{val.subjectProperty?.suburb || 'N/A'}, {val.subjectProperty?.region || 'N/A'}</h5>
                          <p className="text-xs text-slate-500">{val.method} • {new Date(val.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">GHS {val.finalValue?.toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{val.method}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 font-bold text-sm">No recent valuations found.</p>
                  </div>
                )}
              </div>
            </div>

            {user?.role === 'Admin' ? (
              <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden group border border-white/10 shadow-xl shadow-slate-900/20">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <ShieldAlert size={24} className="mr-2 text-accent" />
                    Admin Control
                  </h3>
                  <p className="text-slate-300 text-sm mb-8 leading-relaxed font-medium">
                    Manage the property database, update comparable sales records, and oversee platform activity.
                  </p>
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full py-4 bg-white text-primary font-black rounded-2xl shadow-lg hover:scale-[1.02] transition-all active:scale-95 text-center block"
                  >
                    Enter Admin Portal
                  </button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/20 rounded-full blur-[80px] group-hover:bg-accent/30 transition-all duration-500"></div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4">Go Professional</h3>
                  <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                    Unlock unlimited valuations, advanced heatmaps, and watermark-free PDF reports.
                  </p>
                  <button className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition active:scale-95">
                    Upgrade Now
                  </button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition"></div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;