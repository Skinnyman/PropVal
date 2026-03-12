import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Save,
  MapPin,
  Home,
  DollarSign,
  Maximize,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Clock,
  Check,
  X,
  User
} from 'lucide-react';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({
    suburb: '',
    district: '',
    region: 'Greater Accra',
    propertyType: 'Detached House',
    price: '',
    rentalValue: '',
    capRate: '',
    occupancyRate: '',
    constructionCostPerSqm: '',
    marketDemandIndicator: 'Moderate',
    rooms: '',
    size: '',
    landSize: '',
    yearBuilt: new Date().getFullYear(),
    condition: 'Good',
    transactionDate: new Date().toISOString().split('T')[0],
    coordinates: { lng: '', lat: '' }
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'moderation'
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loadingModeration, setLoadingModeration] = useState(false);

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

  React.useEffect(() => {
    if (activeTab === 'moderation') {
      fetchPending();
    }
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Format data for backend
      const propertyData = {
        location: {
          region: formData.region,
          district: formData.district,
          suburb: formData.suburb,
          coordinates: {
            lng: Number(formData.coordinates.lng),
            lat: Number(formData.coordinates.lat)
          }
        },
        propertyInfo: {
          propertyType: formData.propertyType,
          landSize: Number(formData.landSize),
          size: Number(formData.size),
          rooms: Number(formData.rooms),
          yearBuilt: Number(formData.yearBuilt),
          condition: formData.condition
        },
        marketData: {
          salePrice: Number(formData.price),
          rentalValue: Number(formData.rentalValue),
          capRate: Number(formData.capRate),
          occupancyRate: Number(formData.occupancyRate),
          constructionCostPerSqm: Number(formData.constructionCostPerSqm),
          marketDemandIndicator: formData.marketDemandIndicator,
          transactionDate: formData.transactionDate
        }
      };

      await api.post('/properties', propertyData);

      setStatus({ type: 'success', message: 'Property record added successfully!' });
      setFormData({
        suburb: '',
        district: '',
        region: 'Greater Accra',
        propertyType: 'Detached House',
        price: '',
        rentalValue: '',
        capRate: '',
        occupancyRate: '',
        constructionCostPerSqm: '',
        marketDemandIndicator: 'Moderate',
        rooms: '',
        size: '',
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
        <header className="bg-white border-b px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-primary">Admin Portal</h1>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-2 rounded-xl text-sm font-black transition ${activeTab === 'add' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Add Property
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`px-6 py-2 rounded-xl text-sm font-black transition flex items-center ${activeTab === 'moderation' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
            >
              Moderation Queue
              {pendingProperties.length > 0 && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto">
          {status.message && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-bold">{status.message}</span>
            </div>
          )}

          {activeTab === 'add' ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <form onSubmit={onSubmit} className="p-10 space-y-10">
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
                          <option>Detached House</option>
                          <option>Apartment</option>
                          <option>Townhouse</option>
                          <option>Office Space</option>
                          <option>Land</option>
                          <option>Commercial</option>
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
          ) : (
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
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
