import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ToastContainer from '../components/Toast';
import { useToast } from '../hooks/useToast';
import {
  Plus,
  TrendingUp,
  Users,
  Search,
  ShieldAlert,
  LayoutGrid,
  Building2,
  BarChart3,
  Database,
  Home,
  Briefcase,
  ChevronRight,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Info
} from 'lucide-react';

// Notification type configuration
const NOTIF_CONFIG = {
  approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', badge: 'Approved' },
  pending:  { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   badge: 'Pending'  },
  rejected: { icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100',     badge: 'Rejected' },
  info:     { icon: Info,         color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100',    badge: 'Info'     },
};

const Dashboard = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();
  const hasFetchedNotifs = useRef(false);

  const [stats, setStats] = useState([
    { label: 'Total Valuations', value: '0', change: '+0', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Saved Comparables', value: '0', change: '+0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Market Transactions', value: '0', change: '+0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Average Price', value: 'GHS 0K', icon: TrendingUp },
    { label: 'Property Types', value: {} }
  ]);
  const [recentValuations, setRecentValuations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Fetch notifications (manual + once on mount)
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get('/notifications');
      const fetched = Array.isArray(res.data) ? res.data : [];
      setNotifications(fetched);

      // Show toasts only on the very first load (login)
      if (!hasFetchedNotifs.current) {
        hasFetchedNotifs.current = true;
        const unread = fetched.filter(n => !n.read && (n.type === 'approved' || n.type === 'rejected'));
        unread.forEach(n => {
          showToast(n.title, n.message, n.type);
          api.put(`/notifications/${n._id}/read`).catch(() => {});
        });
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  }, [showToast]);

  // Delete a notification
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        await refreshUser();
        const [valuationsRes, propertiesRes] = await Promise.all([
          api.get('/valuations'),
          api.get('/properties'),
        ]);

        const valuations = Array.isArray(valuationsRes.data) ? valuationsRes.data : [];
        const properties = Array.isArray(propertiesRes.data) ? propertiesRes.data : [];

        const totalValue = properties.reduce((acc, p) => acc + (p.marketData?.salePrice || 0), 0);
        const avgPrice = properties.length > 0 ? (totalValue / properties.length / 1000).toFixed(0) : 0;

        const distribution = properties.reduce((acc, p) => {
          const type = p.propertyInfo?.propertyType || 'Other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        setStats([
          { label: 'Total Valuations', value: valuations.length.toString(), change: `+${valuations.length}`, icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Saved Comparables', value: (user?.savedProperties?.length || 0).toString(), change: '+0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Market Transactions', value: properties.length.toString(), change: `+${properties.length}`, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'AVERAGE PRICE', value: `GHS ${avgPrice}K`, icon: TrendingUp },
          { label: 'PROPERTY_TYPES', value: distribution }
        ]);

        setRecentValuations(valuations.slice(0, 3));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchDashboardData();
    // Notifications are loaded manually via the Refresh button
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.savedProperties?.length, refreshUser]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl md:text-2xl font-bold text-primary">Overview</h1>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-accent w-full md:w-64 transition"
              />
            </div>
            {/* Notification bell in header */}
            <div className="relative">
              <button className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary transition">
                <Bell size={18} />
              </button>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <div className="w-10 h-10 bg-accent rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Dashboard Header Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
              <LayoutGrid size={16} />
              <span>Dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"></div>
                {stats[2]?.value || 0} Properties
              </div>
              <div className="flex items-center px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                {stats[0]?.value || 0} Valuations
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold">
                Valuer
              </div>
            </div>
          </div>

          {/* Hero Banner Section */}
          <div className="bg-blue-700 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-16 mb-12 relative overflow-hidden shadow-2xl shadow-slate-900/40">
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-slate-300 font-bold tracking-widest text-[10px] md:text-xs uppercase mb-4 opacity-80">Welcome to</h3>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                PropVal GH <span className="text-[black]">Dashboard</span>
              </h2>
              <p className="text-white text-base md:text-lg mb-10 leading-relaxed font-medium opacity-90">
                Ghana's professional property valuation and data intelligence platform.
                A.I.S valuation methods, full property database.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/valuation')}
                  className="px-8 py-4 bg-[#facc15] text-[#0f172a] font-black rounded-xl shadow-xl shadow-yellow-500/10 hover:scale-[1.03] transition flex items-center justify-center"
                >
                  <Plus size={20} className="mr-2" />
                  New Valuation
                </button>
                <button
                  onClick={() => navigate('/properties')}
                  className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl backdrop-blur-md hover:bg-white/20 transition flex items-center justify-center"
                >
                  <Database size={20} className="mr-2" />
                  Browse Properties
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
            <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          </div>

          {/* Main Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'TOTAL PROPERTIES', value: stats[2].value, icon: Home, sub: 'In database', trend: 'up' },
              { label: 'VALUATIONS DONE', value: stats[0].value, icon: BarChart3, sub: 'This month', trend: 'check' },
              { label: 'AVG. SALE PRICE', value: stats[3]?.value || 'GHS 0K', icon: TrendingUp, sub: 'Across all types', trend: 'up' },
              { label: 'VERIFIED RECORDS', value: recentValuations.length + (parseInt(stats[0].value) || 0), icon: ShieldAlert, sub: 'Verified', trend: 'check' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{stat.label}</span>
                  <div className="w-10 h-10 bg-slate-50 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <stat.icon size={18} />
                  </div>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-primary mb-1">{stat.value}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Notifications Feed ─────────────────────────────── */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10 mb-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-primary flex items-center">
                <Bell size={20} className="mr-3 text-accent" />
                Notifications
              </h3>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {notifications.length} update{notifications.length !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  onClick={fetchNotifications}
                  disabled={notifLoading}
                  title="Refresh notifications"
                  className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-500 transition disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${notifLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {notifLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {notifLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell size={28} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold text-sm">No notifications yet</p>
                <p className="text-slate-300 text-xs mt-1">Updates about your submitted properties will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(n => {
                  const config = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.info;
                  const Icon = config.icon;
                  return (
                    <div
                      key={n._id}
                      className={`flex items-start p-5 rounded-2xl border ${config.bg} ${config.border} ${!n.read ? 'ring-1 ring-slate-200' : ''} transition group`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 bg-white shadow-sm`}>
                        <Icon size={18} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-primary">{n.title}</p>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                            {config.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest">
                          {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNotification(n._id)}
                        title="Dismiss notification"
                        className="ml-4 p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-white transition shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Core Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Quick Valuation Methods */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
              <h3 className="text-xl font-black text-primary mb-10 flex items-center">
                Quick Valuation Methods
              </h3>
              <div className="space-y-8">
                {[
                  { name: 'Comparable Sales', desc: 'Market approach using comps', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { name: 'Income Capitalization', desc: 'For income producing properties', icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { name: 'Cost Method', desc: 'Land + construction - depreciation', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { name: 'Residual Method', desc: 'Development land valuation', icon: Database, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { name: 'Profit Method', desc: 'Hotels, restaurants, business', icon: Briefcase, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center group cursor-pointer"
                    onClick={() => navigate('/valuation', { state: { selectedMethod: item.name } })}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mr-6 group-hover:scale-110 transition-transform`}>
                      <item.icon size={22} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-primary text-base group-hover:text-accent transition-colors">{item.name}</h5>
                      <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>

            {/* Database by Property Type */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
              <h3 className="text-xl font-black text-primary mb-10">
                Database by Property Type
              </h3>
              <div className="space-y-10">
                {['Residential', 'Commercial', 'Land', 'Office', 'Mixed-use', 'Industrial'].map((type, i) => {
                  const count = stats[4]?.value?.[type] || 0;
                  const total = parseInt(stats[2].value) || 1;
                  const percentage = (count / total) * 100;
                  const colors = ['bg-[#1e293b]', 'bg-[#fbbf24]', 'bg-[#e2e8f0]', 'bg-[#0d9488]', 'bg-[#9333ea]', 'bg-[#dc2626]'];
                  return (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-black tracking-tight text-slate-700">
                        <span className="uppercase">{type}</span>
                        <span className="text-slate-400">{count} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;