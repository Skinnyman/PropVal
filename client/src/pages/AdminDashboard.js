import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import {
  Users,
  Activity,
  Home,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  DollarSign,
  Maximize,
  Save,
  X,
  Check,
  FileText,
  ChevronDown,
  User,
  Plus,
  Search,
  Trash2,
  Edit2,
  BarChart3,
  Download,
  Award,
  Shield,
  Database
} from 'lucide-react';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({
    suburb: '',
    district: '',
    region: 'Greater Accra',
    propertyType: 'Residential',
    price: '',
    rentalValue: '',
    capRate: '',
    occupancyRate: '',
    constructionCostPerSqm: '',
    marketDemandIndicator: 'Moderate',
    rooms: '',
    size: '',
    landSize: '',
    yearBuilt: '',
    condition: 'Excellent',
    transactionDate: new Date().toISOString().split('T')[0],
    dataSourceReference: 'Manual Entry',
    coordinates: { lng: '-0.187', lat: '5.603' }
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'add', 'database', 'users', or 'valuations'
  const [dbSubTab, setDbSubTab] = useState('properties');
  const [allProperties, setAllProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propSearch, setPropSearch] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState('All');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [analytics, setAnalytics] = useState({ users: 0, properties: 0, valuations: 0, pendingProperties: 0 });
  const [selectedModerationProperty, setSelectedModerationProperty] = useState(null);
  const [allValuations, setAllValuations] = useState([]);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [marketDataList, setMarketDataList] = useState([]);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [selectedMarketEntry, setSelectedMarketEntry] = useState(null);
  const [dbSearch, setDbSearch] = useState('');
  const [dbCategoryFilter, setDbCategoryFilter] = useState('All');
  const [displayCounts, setDisplayCounts] = useState({ users: 0, properties: 0, valuations: 0 });

  const fetchAllProperties = async () => {
    setLoadingProperties(true);
    try {
      const res = await api.get('/admin/properties');

      setAllProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleModerate = async (id, status) => {
    try {
      await api.put(`/properties/${id}/status`, { status });
      // Update local state for allProperties
      setAllProperties(prev => prev.map(p => p._id === id ? { ...p, verificationStatus: status } : p));
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserStatus = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}/status`, { status });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, accountStatus: status } : u));
    } catch (err) {
      console.error(err);
      alert('Error updating user status');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllValuations = async () => {
    setLoadingValuations(true);
    try {
      const res = await api.get('/admin/valuations');
      setAllValuations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingValuations(false);
    }
  };

  const fetchMarketData = async () => {
    setLoadingMarketData(true);
    try {
      const res = await api.get('/admin/market-data');
      setMarketDataList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMarketData(false);
    }
  };

  const handleVerifyMarketData = async (id) => {
    try {
      await api.patch(`/admin/market-data/${id}/verify`);
      setMarketDataList(prev => prev.map(item => item._id === id ? { ...item, isVerified: true } : item));
    } catch (err) {
      console.error(err);
      alert('Error verifying record');
    }
  };

  const handleEditMarketData = (item) => {
    setSelectedMarketEntry(item);
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedMarketEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selectedMarketEntry) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/admin/market-data/${selectedMarketEntry._id}`, selectedMarketEntry);
      setMarketDataList(prev => prev.map(item => item._id === selectedMarketEntry._id ? selectedMarketEntry : item));
      setSelectedMarketEntry(null);
      setStatus({ type: 'success', message: 'Record updated successfully' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to update record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMarketData = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/market-data/${id}`);
      setMarketDataList(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error(err);
      alert('Error deleting record');
    }
  };

  // Animate stat counters when analytics load
  useEffect(() => {
    const duration = 800;
    const fps = 30;
    const steps = duration / (1000 / fps);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplayCounts({
        users: Math.round(analytics.users * progress),
        properties: Math.round(analytics.properties * progress),
        valuations: Math.round(analytics.valuations * progress)
      });
      if (step >= steps) clearInterval(timer);
    }, 1000 / fps);
    return () => clearInterval(timer);
  }, [analytics]);

  useEffect(() => {
    if (activeTab === 'overview') fetchAnalytics();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'valuations') fetchAllValuations();
    if (activeTab === 'database') {
       fetchAllProperties();
       fetchMarketData();
    }
  }, [activeTab]);

  // Compute top contributors from marketDataList
  const topContributors = React.useMemo(() => {
    const map = {};
    marketDataList.forEach(item => {
      const key = item.uploadedBy?._id || 'anon';
      if (!map[key]) map[key] = { name: item.uploadedBy?.name || 'Authorized Valuer', email: item.uploadedBy?.email || '', count: 0, verified: 0 };
      map[key].count++;
      if (item.isVerified) map[key].verified++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [marketDataList]);

  // Category breakdown counts
  const categoryBreakdown = React.useMemo(() => {
    const cats = {};
    marketDataList.forEach(item => {
      if (!item.category) return;
      cats[item.category] = (cats[item.category] || 0) + 1;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [marketDataList]);

  const DB_CATEGORIES = ['All', 'Sale Transactions', 'Rental Evidence', 'Construction Costs', 'Building Materials', 'Cap Rates / Yields', 'Land Values', 'Market Overview'];

  const filteredDataBank = marketDataList.filter(item => {
    const matchCat = dbCategoryFilter === 'All' || item.category === dbCategoryFilter;
    const q = dbSearch.toLowerCase();
    const matchSearch = !q || [item.city, item.area, item.category, item.uploadedBy?.name].some(v => v?.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const filteredProperties = allProperties.filter(p => {
    const matchStatus = propStatusFilter === 'All' || p.verificationStatus === propStatusFilter;
    const q = propSearch.toLowerCase();
    const matchSearch = !q || [p.location?.suburb, p.propertyInfo?.propertyType, p.uploadedBy?.name].some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const exportToCSV = () => {
    const headers = ['Category', 'City', 'Area', 'Property Type', 'Price/Value', 'Status', 'Uploaded By', 'Date'];
    const rows = filteredDataBank.map(item => [
      item.category,
      item.city || '',
      item.area || '',
      item.propertyType || '',
      item.price || item.rent || item.cost || item.capRate || '',
      item.isVerified ? 'Verified' : 'Pending',
      item.uploadedBy?.name || 'Valuer',
      new Date(item.updatedAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `databank-export-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      alert("You can only upload up to 5 images.");
      return;
    }

    setImageFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const formDataToSend = new FormData();
      
      // Structure the data as expected by the backend standardizer
      const locationData = {
        region: formData.region,
        district: formData.district,
        suburb: formData.suburb,
        coordinates: {
          lng: Number(formData.coordinates.lng),
          lat: Number(formData.coordinates.lat)
        }
      };

      const propertyInfoData = {
        propertyType: formData.propertyType,
        landSize: Number(formData.landSize),
        size: Number(formData.size),
        rooms: Number(formData.rooms),
        yearBuilt: Number(formData.yearBuilt),
        condition: formData.condition
      };

      const marketDataObj = {
        salePrice: Number(formData.salePrice),
        rentalValue: Number(formData.rentalValue)
      };

      formDataToSend.append('location', JSON.stringify(locationData));
      formDataToSend.append('propertyInfo', JSON.stringify(propertyInfoData));
      formDataToSend.append('marketData', JSON.stringify(marketDataObj));
      formDataToSend.append('dataSourceReference', formData.dataSourceReference);

      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      await api.post('/properties', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatus({ type: 'success', message: 'Property record added and approved successfully!' });
      // Reset form
      setFormData({
        landSize: '',
        yearBuilt: new Date().getFullYear(),
        condition: 'Good',
        transactionDate: new Date().toISOString().split('T')[0],
        coordinates: { lng: '', lat: '' }
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.msg || 'Failed to add property record.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-40 gap-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg md:text-2xl font-bold text-primary">Admin Portal</h1>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full hide-scrollbar -mx-2 md:mx-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition whitespace-nowrap ${activeTab === 'add' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Add Property
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition flex items-center whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Users
              {users.filter(u => u.accountStatus === 'Pending').length > 0 && <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full"></span>}
            </button>
            <button
              onClick={() => setActiveTab('valuations')}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition whitespace-nowrap ${activeTab === 'valuations' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Valuations
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition flex items-center whitespace-nowrap ${activeTab === 'database' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Master Database
              {(allProperties.some(p => p.verificationStatus === 'Pending') || marketDataList.some(m => !m.isVerified)) && <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>}
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {status.message && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-bold">{status.message}</span>
            </div>
          )}

          {activeTab === 'overview' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Users', value: displayCounts.users, icon: <Users size={28} />, bg: 'bg-blue-50', color: 'text-accent', trend: '+12%' },
                  { label: 'Market Records', value: displayCounts.properties, icon: <Database size={28} />, bg: 'bg-emerald-50', color: 'text-emerald-500', trend: '+8%' },
                  { label: 'Valuations', value: displayCounts.valuations, icon: <Activity size={28} />, bg: 'bg-amber-50', color: 'text-amber-500', trend: '+5%' },
                ].map((card) => (
                  <div key={card.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-inner`}>{card.icon}</div>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">{card.trend}</span>
                    </div>
                    <h3 className="text-4xl font-black text-primary tabular-nums">{card.value.toLocaleString()}</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center"><BarChart3 size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Bank</p>
                      <h3 className="text-sm font-black text-primary">Category Breakdown</h3>
                    </div>
                  </div>
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-slate-400 text-xs font-bold text-center py-8">No data records yet</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryBreakdown.map(([cat, count], i) => {
                        const max = categoryBreakdown[0]?.[1] || 1;
                        const colors = ['bg-accent', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500'];
                        return (
                          <div key={cat}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-bold text-slate-600 truncate max-w-[70%]">{cat}</span>
                              <span className="text-xs font-black text-primary">{count}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`${colors[i % colors.length]} h-2 rounded-full transition-all duration-700`} style={{ width: `${(count / max) * 100}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top Contributors */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center"><Award size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leaderboard</p>
                      <h3 className="text-sm font-black text-primary">Top Contributors</h3>
                    </div>
                  </div>
                  {topContributors.length === 0 ? (
                    <p className="text-slate-400 text-xs font-bold text-center py-8">No contributions yet. Go to the Data Bank tab first.</p>
                  ) : (
                    <div className="space-y-3">
                      {topContributors.map((c, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-slate-50 transition">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-700/60'}`}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-primary truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{c.verified}/{c.count} verified</p>
                          </div>
                          <span className="text-xs font-black text-accent bg-blue-50 px-2 py-1 rounded-lg">{c.count} records</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* System Health Banner */}
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="text-emerald-400" size={24} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">System Status</span>
                  </div>
                  <h2 className="text-4xl font-black mb-4 leading-tight">System Health <br /> Under Control.</h2>
                  <p className="text-slate-400 font-bold max-w-md">Monitoring PropVal GH infrastructure and data integrity in real-time.</p>
                  <div className="mt-6 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-emerald-400">API Online</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-emerald-400">DB Connected</span>
                    </div>
                  </div>
                </div>
                {analytics.pendingProperties > 0 && (
                  <div className="relative z-10 mt-8 md:mt-0">
                    <button onClick={() => setActiveTab('moderation')} className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-5 rounded-[2rem] font-black flex items-center shadow-2xl shadow-amber-500/20 transition-all active:scale-95 animate-bounce">
                      <AlertCircle className="mr-3" size={24} /> {analytics.pendingProperties} Pending Approvals
                    </button>
                  </div>
                )}
                <div className="w-64 h-64 bg-accent/20 rounded-full blur-3xl absolute -right-20 -top-20"></div>
                <div className="w-96 h-96 bg-blue-500/10 rounded-full blur-3xl absolute -left-20 -bottom-20"></div>
              </div>
            </div>
          ) : activeTab === 'add' ? (
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <form onSubmit={onSubmit} className="p-6 md:p-10 space-y-8 md:space-y-10">
                {/* Basic Info Section */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <Home className="text-accent" size={20} />
                    <h3 className="text-lg font-bold text-primary uppercase tracking-wider">Property Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Suburb</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          name="suburb" value={formData.suburb} onChange={onChange} required
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                          placeholder="e.g. East Legon"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                      <input
                        name="district" value={formData.district} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="e.g. Accra Metropolitan"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                      <div className="relative">
                        <select
                          name="region" value={formData.region} onChange={onChange}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none appearance-none"
                        >
                          <option>Greater Accra</option>
                          <option>Ashanti Region</option>
                          <option>Western Region</option>
                          <option>Central Region</option>
                          <option>Eastern Region</option>
                          <option>Northern Region</option>
                          <option>Volta Region</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Property Type</label>
                      <div className="relative">
                        <select
                          name="propertyType" value={formData.propertyType} onChange={onChange}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none appearance-none"
                        >
                          <option>Residential</option>
                          <option>Commercial</option>
                          <option>Land</option>
                          <option>Office</option>
                          <option>Mixed-use</option>
                          <option>Industrial</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Market Data Section */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <DollarSign className="text-accent" size={20} />
                    <h3 className="text-lg font-bold text-primary uppercase tracking-wider">Market Data</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sale Price (GHS)</label>
                      <input
                        type="number" name="price" value={formData.price} onChange={onChange} required
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="e.g. 4500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Rental Value (GHS/yr)</label>
                      <input
                        type="number" name="rentalValue" value={formData.rentalValue} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="e.g. 120000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cap Rate (%)</label>
                      <input
                        type="number" name="capRate" value={formData.capRate} onChange={onChange} step="0.1"
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="e.g. 8.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Occupancy Rate (%)</label>
                      <input
                        type="number" name="occupancyRate" value={formData.occupancyRate} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="e.g. 95"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Const. Cost/Sqm (GHS)</label>
                      <input
                        type="number" name="constructionCostPerSqm" value={formData.constructionCostPerSqm} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="e.g. 2500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Market Demand</label>
                      <select
                        name="marketDemandIndicator" value={formData.marketDemandIndicator} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none appearance-none"
                      >
                        <option>Low</option>
                        <option>Moderate</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Transaction Date</label>
                      <input
                        type="date" name="transactionDate" value={formData.transactionDate} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Specs Section */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <Maximize className="text-accent" size={20} />
                    <h3 className="text-lg font-bold text-primary uppercase tracking-wider">Specifications</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Building Size (sqm)</label>
                      <input
                        type="number" name="size" value={formData.size} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="350"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Land Size (sqm/acres)</label>
                      <input
                        type="number" name="landSize" value={formData.landSize} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="0.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Rooms/Units</label>
                      <input
                        type="number" name="rooms" value={formData.rooms} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="4"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Year Built</label>
                      <input
                        type="number" name="yearBuilt" value={formData.yearBuilt} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                        placeholder="2022"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Condition</label>
                      <select
                        name="condition" value={formData.condition} onChange={onChange}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none appearance-none"
                      >
                        <option>Excellent</option>
                        <option>Good</option>
                        <option>Fair</option>
                        <option>Poor</option>
                        <option>Under Construction</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Geo Location Section */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <MapPin className="text-accent" size={20} />
                    <h3 className="text-lg font-bold text-primary uppercase tracking-wider">Map Coordinates</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                        <input
                          name="coordinates.lng" value={formData.coordinates.lng} onChange={onChange} required
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                          placeholder="e.g. -0.187"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                        <input
                          name="coordinates.lat" value={formData.coordinates.lat} onChange={onChange} required
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
                          placeholder="e.g. 5.603"
                        />
                      </div>
                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start space-x-3">
                        <MapPin className="text-accent shrink-0" size={16} />
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                          Tip: click anywhere on the map to automatically pin the exact property coordinates.
                        </p>
                      </div>
                    </div>
                    <div className="h-[300px] md:h-full min-h-[300px]">
                      <MapComponent
                        onLocationSelect={(coords) => {
                          setFormData(prev => ({
                            ...prev,
                            coordinates: {
                              lng: coords.lng.toFixed(6),
                              lat: coords.lat.toFixed(6)
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* Image Upload Section */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <FileText className="text-accent" size={20} />
                    <h3 className="text-lg font-bold text-primary uppercase tracking-wider">Property Images</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {imageFiles.length < 5 && (
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-slate-50 transition group">
                          <div className="w-10 h-10 bg-slate-50 group-hover:bg-blue-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-accent mb-2">
                            <Plus size={24} />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload</span>
                          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Up to 5 high-quality images (JPG/PNG).</p>
                  </div>
                </section>

                <div className="pt-6 border-t border-slate-50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    <span>{isSubmitting ? 'Saving...' : 'Add Property Record'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center">
                  <Users size={20} className="mr-2 text-accent" />
                  User Management ({users.length})
                </h2>
                <button onClick={fetchUsers} className="text-xs font-black text-accent uppercase tracking-widest hover:underline">Refresh List</button>
              </div>

              {loadingUsers ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">No users found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {users.map((u) => (
                    <div key={u._id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                          <User size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-primary">{u.name}</h3>
                          <p className="text-sm text-slate-500">{u.email} • {u.company || 'Independent'}</p>
                          <div className="mt-2 flex space-x-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${u.accountStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                u.accountStatus === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                              }`}>
                              {u.accountStatus}
                            </span>
                            <span className="text-[10px] bg-blue-50 text-accent px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {u.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {u.role !== 'Admin' && (
                        <div className="flex space-x-2 shrink-0">
                          {u.accountStatus !== 'Approved' && (
                            <button
                              onClick={() => handleUserStatus(u._id, 'Approved')}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs hover:bg-emerald-600 transition shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          {u.accountStatus !== 'Rejected' && (
                            <button
                              onClick={() => handleUserStatus(u._id, 'Rejected')}
                              className="px-4 py-2 bg-white border border-slate-200 text-red-500 rounded-xl font-black text-xs hover:bg-red transition"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'valuations' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center">
                  <FileText size={20} className="mr-2 text-blue-500" />
                  Global Valuation History
                </h2>
                <button onClick={fetchAllValuations} className="text-xs font-black text-accent uppercase tracking-widest hover:underline">Refresh Activity</button>
              </div>

              {loadingValuations ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : allValuations.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">No valuations performed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {allValuations.map((v) => (
                    <div key={v._id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50 text-accent rounded-xl flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-primary">{v.subjectProperty?.suburb}, {v.method}</h4>
                          <p className="text-xs text-slate-500">Performed by: <span className="font-bold text-slate-700">{v.valuer?.name || 'Unknown'}</span> ({v.valuer?.email})</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">GHS {v.finalValue?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(v.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'database' ? (
            <div className="space-y-6">
              {/* Sub-Navigation */}
              <div className="flex bg-slate-200 p-1.5 rounded-[1.5rem] max-w-fit shadow-inner mb-2 border border-slate-100">
                <button
                  onClick={() => setDbSubTab('properties')}
                  className={`px-8 py-3 rounded-2xl text-sm font-black transition-all flex items-center ${dbSubTab === 'properties' ? 'bg-white text-primary shadow-lg scale-100' : 'text-slate-500 hover:text-primary hover:bg-white/50'}`}
                >
                  <Home size={16} className="mr-2" /> Property Asset Index
                  {allProperties.some(p => p.verificationStatus === 'Pending') && <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full inline-block animate-pulse"></span>}
                </button>
                <button
                  onClick={() => setDbSubTab('marketData')}
                  className={`px-8 py-3 rounded-2xl text-sm font-black transition-all flex items-center ${dbSubTab === 'marketData' ? 'bg-white text-primary shadow-lg scale-100' : 'text-slate-500 hover:text-primary hover:bg-white/50'}`}
                >
                  <Activity size={16} className="mr-2" /> Market Evidence Bank
                  {marketDataList.some(m => !m.isVerified) && <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full inline-block animate-pulse"></span>}
                </button>
              </div>

              {dbSubTab === 'properties' ? (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   {/* Properties Toolbar */}
                   <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                     <div className="flex items-center space-x-3 flex-1">
                       <Home size={20} className="text-slate-400 shrink-0" />
                       <h2 className="text-lg font-black text-primary">Property Asset Index</h2>
                       <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{filteredProperties.length} records</span>
                     </div>
                     <div className="flex flex-wrap items-center gap-3">
                       <div className="relative">
                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input
                           value={propSearch}
                           onChange={e => setPropSearch(e.target.value)}
                           placeholder="Search properties..."
                           className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-accent outline-none w-48"
                         />
                       </div>
                       <select
                         value={propStatusFilter}
                         onChange={e => setPropStatusFilter(e.target.value)}
                         className="px-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold cursor-pointer"
                       >
                         <option value="All">All Statuses</option>
                         <option value="Pending">Pending</option>
                         <option value="Approved">Approved</option>
                         <option value="Rejected">Rejected</option>
                       </select>
                       <button onClick={fetchAllProperties} className="text-xs font-black text-accent hover:underline uppercase tracking-widest px-2">Refresh</button>
                     </div>
                   </div>

                   {loadingProperties ? (
                     <div className="flex justify-center py-20">
                       <div className="w-full space-y-4">
                         {[1,2,3].map(i => (
                           <div key={i} className="bg-white rounded-[2rem] p-8 border border-slate-100 flex gap-6 animate-pulse">
                             <div className="w-16 h-16 bg-slate-200 rounded-2xl shrink-0"></div>
                             <div className="flex-1 space-y-3">
                               <div className="h-4 bg-slate-200 rounded-full w-1/4"></div>
                               <div className="h-3 bg-slate-100 rounded-full w-1/3"></div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   ) : filteredProperties.length === 0 ? (
                     <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                       <p className="text-slate-400 font-bold">{propSearch || propStatusFilter !== 'All' ? 'No results match your filter.' : 'No property records found.'}</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 gap-4">
                       {filteredProperties.map((prop) => (
                         <div key={prop._id} className={`bg-white rounded-[2rem] p-6 shadow-sm border ${prop.verificationStatus === 'Pending' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'} flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl transition`}>
                           <div className="flex items-start space-x-4 min-w-0 flex-1">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${prop.verificationStatus === 'Approved' ? 'bg-emerald-50 text-emerald-500' : prop.verificationStatus === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                               <Home size={24} />
                             </div>
                             <div className="min-w-0">
                               <div className="flex items-center space-x-2 mb-1">
                                 <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${prop.verificationStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : prop.verificationStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                   {prop.verificationStatus}
                                 </span>
                                 <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                   {prop.propertyInfo.propertyType}
                                 </span>
                               </div>
                               <h3 className="text-lg font-black text-primary truncate">{prop.location.suburb}, {prop.location.district}</h3>
                               <p className="text-slate-400 font-medium text-xs flex items-center mt-1">
                                 <User size={12} className="mr-1" /> {prop.uploadedBy?.name || 'Authorized Valuer'}
                               </p>
                               <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                                 <div className="flex items-center bg-slate-50 px-2 py-1 rounded-lg"><MapPin size={12} className="mr-1" /> {prop.location.region}</div>
                                 <div className="flex items-center bg-slate-50 px-2 py-1 rounded-lg"><Maximize size={12} className="mr-1" /> {prop.propertyInfo?.size} sqm</div>
                                 {(prop.marketData?.salePrice || prop.marketData?.rentalValue) && (
                                   <div className="flex items-center bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                                     <DollarSign size={12} className="mr-1" /> 
                                     GHS {prop.marketData.salePrice ? prop.marketData.salePrice.toLocaleString() : `${prop.marketData.rentalValue.toLocaleString()}/yr`}
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>

                           <div className="flex flex-col space-y-2 shrink-0 min-w-[200px]">
                             {prop.verificationStatus === 'Pending' ? (
                               <div className="flex space-x-2">
                                 <button
                                   onClick={() => handleModerate(prop._id, 'Approved')}
                                   className="flex-1 bg-emerald-500 text-white px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                                 >
                                   <Check size={14} className="mr-1" /> Approve
                                 </button>
                                 <button
                                   onClick={() => handleModerate(prop._id, 'Rejected')}
                                   className="flex-1 bg-white border border-slate-200 text-red-500 px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center hover:bg-red-50 transition"
                                 >
                                   <X size={14} className="mr-1" /> Reject
                                 </button>
                               </div>
                             ) : (
                               <div className="flex space-x-2">
                                 <button
                                   onClick={() => handleModerate(prop._id, prop.verificationStatus === 'Approved' ? 'Rejected' : 'Approved')}
                                   className="flex-1 bg-slate-100 text-slate-600 px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center hover:bg-slate-200 transition"
                                 >
                                   Switch to {prop.verificationStatus === 'Approved' ? 'Rejected' : 'Approved'}
                                 </button>
                               </div>
                             )}
                             <button
                               onClick={() => setSelectedModerationProperty(prop)}
                               className="w-full bg-blue-50 text-accent px-3 py-2.5 rounded-xl font-black text-xs flex items-center justify-center hover:bg-blue-100 transition"
                             >
                               <Search size={14} className="mr-1" /> View Full Details
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  {/* Database Toolbar */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <Database size={20} className="text-slate-400 shrink-0" />
                      <h2 className="text-lg font-black text-primary">Market Evidence Bank</h2>
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{filteredDataBank.length} records</span>
                    </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={dbSearch}
                      onChange={e => setDbSearch(e.target.value)}
                      placeholder="Search city, uploader..."
                      className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-accent outline-none w-48"
                    />
                  </div>
                  {/* Category Filter */}
                  <select
                    value={dbCategoryFilter}
                    onChange={e => setDbCategoryFilter(e.target.value)}
                    className="px-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold cursor-pointer"
                  >
                    {DB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  {/* Export */}
                  <button
                    onClick={exportToCSV}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                  <button onClick={fetchMarketData} className="text-xs font-black text-accent hover:underline uppercase tracking-widest">Refresh</button>
                </div>
              </div>
              {loadingMarketData ? (
                <div className="flex justify-center py-20">
                  {/* Skeleton Loader */}
                  <div className="w-full space-y-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center space-x-4 animate-pulse">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 rounded-full w-1/3"></div>
                          <div className="h-2 bg-slate-100 rounded-full w-1/2"></div>
                        </div>
                        <div className="h-8 w-20 bg-slate-100 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredDataBank.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">{dbSearch || dbCategoryFilter !== 'All' ? 'No results match your filter.' : 'No market data records found.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDataBank.map((item) => (
                    <div key={item._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.isVerified ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                          {item.isVerified ? <Check size={20} /> : <Clock size={20} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{item.category}</span>
                            {!item.isVerified && <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pending Approval</span>}
                          </div>
                          <h4 className="font-bold text-primary truncate lowercase first-letter:uppercase">
                            {item.title || item.propertyType || item.materialName || 'Untitled Entry'} 
                            <span className="text-slate-400 font-normal ml-2">in {item.city || item.location || 'Unknown Location'}</span>
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center">
                            <User size={12} className="mr-1" /> 
                            Uploaded by: <span className="font-bold text-slate-700 ml-1">{item.uploadedBy?.name || 'Authorized Valuer'}</span>
                            <span className="ml-2 text-[10px] opacity-60">• {new Date(item.updatedAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 shrink-0">
                        {!item.isVerified && (
                          <button
                            onClick={() => handleVerifyMarketData(item._id)}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow-sm"
                            title="Approve Submission"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditMarketData(item)}
                          className="p-2 bg-blue-50 text-accent rounded-lg hover:bg-blue-100 transition"
                          title="Edit Record"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMarketData(item._id)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>

      {/* Detail Inspection Modal */}
      {selectedModerationProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b flex items-center justify-between shrink-0">
               <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-50 text-accent rounded-2xl flex items-center justify-center">
                    <Home size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Verify Property Submission</p>
                    <h2 className="text-xl font-black text-primary">{selectedModerationProperty.location.suburb}</h2>
                  </div>
               </div>
               <button onClick={() => setSelectedModerationProperty(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition">
                 <X size={24} />
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
               {/* Image Gallery Preview */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {selectedModerationProperty.propertyInfo?.images?.map((img, i) => (
                   <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                     <img src={img.startsWith('http') ? img : `http://localhost:5000${img}`} className="w-full h-full object-cover" alt="Property" />
                   </div>
                 )) || (
                   <div className="col-span-full py-10 text-center bg-slate-50 rounded-2xl text-slate-400 font-bold uppercase text-[10px] tracking-widest">No images provided</div>
                 )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="space-y-6">
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center">
                      <MapPin className="mr-2 text-accent" size={14} /> Full Location
                    </h4>
                    <div className="p-6 bg-slate-50 rounded-2xl space-y-3">
                       <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Suburb:</span> <span className="text-sm font-black">{selectedModerationProperty.location.suburb}</span></div>
                       <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">District:</span> <span className="text-sm font-black">{selectedModerationProperty.location.district}</span></div>
                       <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Region:</span> <span className="text-sm font-black">{selectedModerationProperty.location.region}</span></div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center">
                      <Maximize className="mr-2 text-accent" size={14} /> Specifications
                    </h4>
                    <div className="p-6 bg-slate-50 rounded-2xl space-y-3">
                       <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Type:</span> <span className="text-sm font-black">{selectedModerationProperty.propertyInfo.propertyType}</span></div>
                       <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Building Size:</span> <span className="text-sm font-black">{selectedModerationProperty.propertyInfo.size} sqm</span></div>
                       <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Land Size:</span> <span className="text-sm font-black">{selectedModerationProperty.propertyInfo.landSize} sqm</span></div>
                       <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Rooms:</span> <span className="text-sm font-black">{selectedModerationProperty.propertyInfo.rooms}</span></div>
                    </div>
                  </section>
               </div>

               <section className="space-y-6">
                  <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center">
                    <DollarSign className="mr-2 text-accent" size={14} /> Market Pricing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-blue-50 rounded-3xl">
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Sale Value</p>
                       <p className="text-3xl font-black text-primary">GHS {selectedModerationProperty.marketData.salePrice.toLocaleString()}</p>
                    </div>
                    <div className="p-8 bg-emerald-50 rounded-3xl">
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Rental Value (Est)</p>
                       <p className="text-3xl font-black text-primary">GHS {selectedModerationProperty.marketData.rentalValue.toLocaleString()}</p>
                    </div>
                  </div>
               </section>

               <section className="p-8 bg-slate-900 rounded-3xl text-white">
                  <div className="flex items-center space-x-3 mb-4">
                     <User size={16} className="text-slate-400" />
                     <p className="text-xs font-black uppercase tracking-widest text-slate-400">Submitted By</p>
                  </div>
                  <h5 className="text-xl font-black mb-1">{selectedModerationProperty.uploadedBy?.name || 'Authorized Valuer'}</h5>
                  <p className="text-sm text-slate-400">{selectedModerationProperty.uploadedBy?.email || 'Valuer Portal'}</p>
                  <div className="mt-6 flex items-center space-x-2">
                     <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-black uppercase tracking-widest opacity-60">
                        {new Date(selectedModerationProperty.createdAt).toLocaleDateString()}
                     </span>
                     <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-black uppercase tracking-widest opacity-60">
                        Ref: {selectedModerationProperty.dataSourceReference || 'Internal'}
                     </span>
                  </div>
               </section>
            </div>

            <footer className="p-8 border-t flex space-x-4 bg-slate-50 shrink-0">
               <button 
                 onClick={() => { handleModerate(selectedModerationProperty._id, 'Approved'); setSelectedModerationProperty(null); }}
                 className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/10 hover:bg-emerald-600 transition"
               >
                 Approve & Publish
               </button>
               <button 
                 onClick={() => { handleModerate(selectedModerationProperty._id, 'Rejected'); setSelectedModerationProperty(null); }}
                 className="flex-1 py-4 bg-white border-2 border-slate-200 text-red-500 font-black rounded-2xl hover:bg-red-50 transition"
               >
                 Reject Submission
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* Market Data Edit Modal */}
      {selectedMarketEntry && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 text-accent rounded-2xl flex items-center justify-center">
                  <Edit2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Administrative Overwrite</p>
                  <h2 className="text-xl font-black text-primary">Edit {selectedMarketEntry.category}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedMarketEntry(null)} className="p-2 text-slate-400 hover:text-primary">
                <X size={24} />
              </button>
            </header>

            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                  <input name="region" value={selectedMarketEntry.region || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <input name="city" value={selectedMarketEntry.city || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Area / Specific Location</label>
                  <input name="area" value={selectedMarketEntry.area || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                </div>

                {/* Category Specific Fields */}
                {(selectedMarketEntry.category === 'Sale Transactions' || selectedMarketEntry.category === 'Land Values') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (GHS)</label>
                      <input name="price" value={selectedMarketEntry.price || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sale Date / Period</label>
                      <input name="saleDate" value={selectedMarketEntry.saleDate || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                  </>
                )}

                {selectedMarketEntry.category === 'Rental Evidence' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rent Amount (GHS)</label>
                      <input name="rent" value={selectedMarketEntry.rent || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Basis (e.g. Monthly)</label>
                      <input name="rentBasis" value={selectedMarketEntry.rentBasis || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                  </>
                )}

                {selectedMarketEntry.category === 'Cap Rates / Yields' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cap Rate (%)</label>
                      <input name="capRate" value={selectedMarketEntry.capRate || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Annual Income</label>
                      <input name="annualRent" value={selectedMarketEntry.annualRent || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Source / Reference</label>
                <input name="source" value={selectedMarketEntry.source || ''} onChange={onEditChange} className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Notes</label>
                <textarea name="notes" value={selectedMarketEntry.notes || ''} onChange={onEditChange} rows="3" className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm" />
              </div>
            </div>

            <footer className="p-8 border-t flex space-x-4 bg-slate-50/50">
              <button 
                onClick={() => setSelectedMarketEntry(null)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition"
              >
                Discard
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Update Record'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
