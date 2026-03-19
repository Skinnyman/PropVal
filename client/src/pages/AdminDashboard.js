import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import {
  Users,
  TrendingUp,
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
  Search
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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'add', 'moderation', 'users', or 'valuations'
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [analytics, setAnalytics] = useState({ users: 0, properties: 0, valuations: 0, pendingProperties: 0 });
  const [selectedModerationProperty, setSelectedModerationProperty] = useState(null);
  const [allValuations, setAllValuations] = useState([]);
  const [loadingValuations, setLoadingValuations] = useState(false);

  const fetchPending = async () => {
    setLoadingModeration(true);
    try {
      const res = await api.get('/properties/moderation');
      setPendingProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModeration(false);
    }
  };

  const handleModerate = async (id, status) => {
    try {
      await api.put(`/properties/${id}/status`, { status });
      setPendingProperties(prev => prev.filter(p => p._id !== id));
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

  React.useEffect(() => {
    if (activeTab === 'overview') fetchAnalytics();
    if (activeTab === 'moderation') fetchPending();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'valuations') fetchAllValuations();
  }, [activeTab]);

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
              onClick={() => setActiveTab('moderation')}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition flex items-center whitespace-nowrap ${activeTab === 'moderation' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Moderation
              {pendingProperties.length > 0 && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center space-x-6">
                  <div className="w-16 h-16 bg-blue-50 text-accent rounded-2xl flex items-center justify-center shadow-inner">
                    <Users size={30} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Users</p>
                    <h3 className="text-3xl font-black text-primary">{analytics.users}</h3>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center space-x-6">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <TrendingUp size={30} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Property Data</p>
                    <h3 className="text-3xl font-black text-primary">{analytics.properties}</h3>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center space-x-6">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <Activity size={30} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Valuations</p>
                    <h3 className="text-3xl font-black text-primary">{analytics.valuations}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 h-full min-h-[300px] overflow-hidden relative">
                <div className="relative z-10">
                  <h2 className="text-4xl font-black mb-4 leading-tight">System Health <br /> Under Control.</h2>
                  <p className="text-slate-400 font-bold text-lg max-w-md">Monitoring PropVal GH infrastructure and data integrity in real-time.</p>
                </div>

                {analytics.pendingProperties > 0 && (
                  <div className="relative z-10 mt-8 md:mt-0 animate-bounce">
                    <button 
                      onClick={() => setActiveTab('moderation')}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-5 rounded-[2rem] font-black flex items-center shadow-2xl shadow-amber-500/20 transition-all active:scale-95"
                    >
                      <AlertCircle className="mr-3" size={24} />
                      {analytics.pendingProperties} Pending Approvals
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
          ) : activeTab === 'moderation' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center">
                  <Clock size={20} className="mr-2 text-amber-500" />
                  Pending Verifications ({pendingProperties.length})
                </h2>
                <button onClick={fetchPending} className="text-xs font-black text-accent uppercase tracking-widest hover:underline">Refresh List</button>
              </div>

              {loadingModeration ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : pendingProperties.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">No properties currently pending verification.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingProperties.map((prop) => (
                    <div key={prop._id} className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-accent shrink-0 border border-blue-100">
                          <Home size={28} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {prop.propertyInfo.propertyType}
                            </span>
                            <span className="text-[10px] bg-blue-50 text-accent px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center">
                              <User size={10} className="mr-1" />
                              {prop.uploadedBy?.name || 'Valuer'}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-primary">{prop.location.suburb}, {prop.location.district}</h3>
                          <p className="text-slate-400 font-medium text-sm flex items-center">
                            <MapPin size={14} className="mr-1" /> {prop.location.region}
                          </p>
                          <div className="mt-4 flex items-center space-x-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center"><Maximize size={14} className="mr-1" /> {prop.propertyInfo.size} sqm</div>
                            <div className="flex items-center"><DollarSign size={14} className="mr-1" /> GHS {prop.marketData.salePrice.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-3 shrink-0">
                        <div className="p-3 bg-slate-50 rounded-xl mb-2">
                          <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Source Reference</p>
                          <p className="text-xs font-medium text-primary line-clamp-2">{prop.dataSourceReference || 'No reference provided'}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedModerationProperty(prop)}
                            className="flex-1 bg-blue-50 text-accent px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center hover:bg-blue-100 transition"
                          >
                            <Search size={16} className="mr-1" /> View Details
                          </button>
                          <button
                            onClick={() => handleModerate(prop._id, 'Approved')}
                            className="flex-1 bg-emerald-500 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/10"
                          >
                            <Check size={16} className="mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => handleModerate(prop._id, 'Rejected')}
                            className="flex-1 bg-white border-2 border-slate-100 text-red-500 px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center hover:bg-red-50 transition"
                          >
                            <X size={16} className="mr-1" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  );
};

export default AdminDashboard;
