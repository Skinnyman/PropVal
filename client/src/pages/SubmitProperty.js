import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import ToastContainer from '../components/Toast';
import { useToast } from '../hooks/useToast';
import {
  MapPin,
  Home,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Info,
  Navigation,
  Calendar,
  Database,
  Loader2,
  Plus
} from 'lucide-react';

const SubmitProperty = () => {
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    suburb: '',
    district: '',
    region: 'Greater Accra',
    propertyType: 'Residential',
    price: '',
    rentalValue: '',
    landSize: '',
    buildingSize: '',
    rooms: '',
    yearBuilt: '',
    condition: 'Good',
    lat: '',
    lng: '',
    transactionDate: new Date().toISOString().split('T')[0],
    dataSourceReference: '',
    capRate: '',
    occupancyRate: '',
    constructionCostPerSqm: '',
    marketDemandIndicator: 'Moderate'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();

      const locationData = {
        region: formData.region,
        district: formData.district,
        suburb: formData.suburb,
        coordinates: {
          lng: Number(formData.lng),
          lat: Number(formData.lat)
        }
      };

      const propertyInfoData = {
        propertyType: formData.propertyType,
        landSize: Number(formData.landSize),
        size: Number(formData.buildingSize),
        rooms: Number(formData.rooms),
        yearBuilt: Number(formData.yearBuilt),
        condition: formData.condition
      };

      const marketDataObj = {
        salePrice: Number(formData.price),
        rentalValue: Number(formData.rentalValue),
        capRate: Number(formData.capRate),
        occupancyRate: Number(formData.occupancyRate),
        constructionCostPerSqm: Number(formData.constructionCostPerSqm),
        marketDemandIndicator: formData.marketDemandIndicator,
        transactionDate: formData.transactionDate
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
      showToast('⏳ Property Submitted', 'Your property is pending admin review and will be published once approved.', 'pending');
      setSubmitted(true);
      setTimeout(() => navigate('/properties'), 3000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.msg || 'There was an error submitting your property. Please check your data.';
      showToast('Submission Failed', errorMsg, 'rejected');
    } finally {
      setLoading(false);
    }
  };

  // Professional check removed to allow all users access

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 sticky top-0 z-40 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">Contribute Data</h1>
            <p className="text-xs text-slate-400 font-medium">Add verified transaction records to the collaborative database</p>
          </div>
          <div className="flex items-center space-x-2 text-[10px] bg-blue-50 text-accent px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            <Info size={12} />
            <span>Adheres to Concept Phase 1-2</span>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {submitted ? (
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-8 md:p-16 shadow-2xl text-center border-2 border-emerald-100">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-emerald-50">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-primary mb-4">Submission Received</h2>
              <p className="text-slate-500 text-base md:text-lg mb-8 max-w-lg mx-auto">
                Thank you for your contribution. Your record has been sent to the moderation queue for verification.
                You will be notified once it is approved.
              </p>
              <div className="flex justify-center space-x-4">
                <button onClick={() => navigate('/properties')} className="px-8 py-4 text-slate-500 font-bold hover:text-primary transition">Back to Explorer</button>
                <button onClick={() => setSubmitted(false)} className="px-8 py-4 bg-accent text-white rounded-3xl font-black shadow-xl shadow-blue-500/20">Submit Another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
              <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100">
                <div className="flex items-center space-x-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 bg-blue-50 text-accent rounded-xl flex items-center justify-center">
                    <MapPin size={20} />
                  </div>
                  <h2 className="text-xl font-black text-primary uppercase tracking-tight">1. Property Location</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Region</label>
                    <select name="region" value={formData.region} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary">
                      <option>Greater Accra</option>
                      <option>Ashanti</option>
                      <option>Western</option>
                      <option>Eastern</option>
                      <option>Central</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">District</label>
                    <input name="district" placeholder="e.g. Ayawaso West" value={formData.district} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Suburb</label>
                    <input name="suburb" placeholder="e.g. East Legon" value={formData.suburb} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Latitude</label>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-4 text-slate-300" size={16} />
                      <input name="lat" placeholder="5.6037" value={formData.lat} onChange={handleChange} className="w-full pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Longitude</label>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-4 text-slate-300 transform rotate-90" size={16} />
                      <input name="lng" placeholder="-0.1870" value={formData.lng} onChange={handleChange} className="w-full pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs & Features */}
              <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100">
                <div className="flex items-center space-x-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                    <Home size={20} />
                  </div>
                  <h2 className="text-xl font-black text-primary uppercase tracking-tight">2. Property Specifications</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Property Type</label>
                    <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary">
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Land</option>
                      <option>Office</option>
                      <option>Mixed-use</option>
                      <option>Industrial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Property Condition</label>
                    <select name="condition" value={formData.condition} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary">
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Fair</option>
                      <option>Needs Renovation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Land Area (sqm)</label>
                    <input name="landSize" type="number" value={formData.landSize} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Build Area (sqm)</label>
                    <input name="buildingSize" type="number" value={formData.buildingSize} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Rooms / Units</label>
                    <input name="rooms" type="number" value={formData.rooms} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Year Built</label>
                    <input name="yearBuilt" type="number" value={formData.yearBuilt} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                </div>
              </div>

              {/* Market Data */}
              <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100">
                <div className="flex items-center space-x-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <h2 className="text-xl font-black text-primary uppercase tracking-tight">3. Market & Financial Data</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Sale Price (GHS)</label>
                    <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Rental Value /mo</label>
                    <input name="rentalValue" type="number" value={formData.rentalValue} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Transaction Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-4 text-slate-300" size={16} />
                      <input name="transactionDate" type="date" value={formData.transactionDate} onChange={handleChange} className="w-full pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Cap Rate (%)</label>
                    <input name="capRate" type="number" step="0.1" value={formData.capRate} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Occupancy (%)</label>
                    <input name="occupancyRate" type="number" value={formData.occupancyRate} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Const. Cost/Sqm</label>
                    <input name="constructionCostPerSqm" type="number" value={formData.constructionCostPerSqm} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1 text-[10px]">Market Demand</label>
                    <select name="marketDemandIndicator" value={formData.marketDemandIndicator} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 focus:border-accent transition outline-none font-bold text-primary">
                      <option>Low</option>
                      <option>Moderate</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100">
                <div className="flex items-center space-x-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 bg-blue-50 text-accent rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-xl font-black text-primary uppercase tracking-tight">4. Property Images</h2>
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
                          <Database size={14} />
                        </button>
                      </div>
                    ))}
                    {imageFiles.length < 5 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-slate-50 transition group">
                        <div className="w-10 h-10 bg-slate-50 group-hover:bg-blue-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-accent mb-2">
                          <Plus size={24} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Up to 5 property photos (Indoor/Outdoor).</p>
                </div>
              </div>

              {/* Data Source Section */}
              <div className="bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-800 text-white">
                <div className="flex items-center space-x-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">5. Source Verification</h2>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase ml-1">Data Source Reference</label>
                  <textarea
                    name="dataSourceReference"
                    placeholder="Provide details about the source (e.g. Registered Broker Name, Market Survey Report ID, Developer Publication, etc.)"
                    value={formData.dataSourceReference}
                    onChange={handleChange}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 focus:border-accent transition outline-none font-medium h-32"
                    required
                  ></textarea>
                </div>

                <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5 flex items-start space-x-4">
                  <div className="text-amber-400 shrink-0 mt-1"><AlertCircle size={20} /></div>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    By submitting, you certify that this information is accurate to the best of your knowledge.
                    Fake or misleading data submissions may result in account termination.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 pb-12">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-accent text-white px-12 py-5 rounded-3xl font-black text-lg shadow-2xl shadow-blue-500/20 hover:scale-[1.03] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 "
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Submit to Moderation</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubmitProperty;
