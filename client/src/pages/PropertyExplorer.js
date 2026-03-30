import React, { useState, useEffect, useContext, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  MapPin,
  X,
  Home,
  LayoutGrid,
  Map as MapIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  TrendingUp,
  Maximize,
  Clock,
  Activity
} from 'lucide-react';

const ImageGalleryModal = ({ images, onClose, suburb }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const next = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 p-4 md:p-10" onClick={onClose}>
      <button
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-all z-[110]"
        onClick={onClose}
      >
        <X size={32} />
      </button>

      <div className="relative w-full max-w-5xl h-full flex flex-col justify-center items-center" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 text-white mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Viewing Gallery</p>
          <h2 className="text-2xl font-black">{suburb}</h2>
        </div>

        <div className="relative group w-full aspect-video md:h-[70vh] flex items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/20">
          <img
            src={images[currentIndex].startsWith('http') ? images[currentIndex] : `http://localhost:5000${images[currentIndex]}`}
            className="w-full h-full object-contain"
            alt={`Property ${currentIndex + 1}`}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-6 w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={next}
                className="absolute right-6 w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/30 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-accent w-4' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 flex space-x-4 overflow-x-auto max-w-full pb-4 scrollbar-hide">
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all border-2 shrink-0 ${i === currentIndex ? 'border-accent scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              <img src={img.startsWith('http') ? img : `http://localhost:5000${img}`} className="w-full h-full object-cover" alt="Property Thumbnail" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PropertyCard = ({ property, onViewOnMap, onImageClick }) => {
  const navigate = useNavigate();
  const priceSqm = property.marketData?.salePrice && property.propertyInfo?.size
    ? Math.round(property.marketData.salePrice / property.propertyInfo.size)
    : 0;

  const yieldValue = property.marketData?.rentalValue && property.marketData?.salePrice
    ? ((property.marketData.rentalValue * 12) / property.marketData.salePrice * 100).toFixed(1)
    : 0;

  const imageUrls = property.propertyInfo?.images && property.propertyInfo.images.length > 0
    ? property.propertyInfo.images
    : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'];

  const getImageUrl = (url) => url.startsWith('http') ? url : `http://localhost:5000${url}`;
  const mainImage = getImageUrl(imageUrls[0]);

  return (
    <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition duration-500 flex flex-col h-full">
      <div className="h-56 bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => onImageClick(imageUrls, property.location?.suburb)}>
        <div className="absolute inset-0 bg-slate-200 animate-pulse group-hover:hidden"></div>
        <img
          src={mainImage}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          alt="Property"
          onLoad={(e) => e.target.previousSibling.style.display = 'none'}
        />
        <div className="absolute top-5 left-5 flex flex-col space-y-2">
          <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest self-start shadow-xl">
            {property.propertyInfo?.propertyType}
          </span>
          <span className="bg-slate-100 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest self-start shadow-xl flex items-center">
            <MapPin size={10} className="mr-1" />
            {property.location?.region}
          </span>
        </div>
        {property.verificationStatus === 'Approved' && (
          <div className="absolute top-5 right-5 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center shadow-xl">
            <CheckCircle size={10} className="mr-1" /> Verified
          </div>
        )}
        <div className="absolute bottom-5 right-5 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-accent uppercase tracking-widest shadow-xl">
          GHS {priceSqm.toLocaleString()}/m²
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{property.location?.suburb}</h4>
            <h3 className="text-2xl font-black text-primary">GHS {property.marketData?.salePrice?.toLocaleString()}</h3>
          </div>
          <div className="text-right">
            <div className="flex items-center text-emerald-500 font-black text-xs space-x-1">
              <TrendingUp size={14} />
              <span>Yield {yieldValue}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-6 mt-auto">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-slate-400">
              <Home size={12} className="mr-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Built Area</span>
            </div>
            <span className="text-xs font-black text-primary uppercase">{property.propertyInfo?.size || 0} m²</span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-slate-400">
              <Maximize size={12} className="mr-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Rooms</span>
            </div>
            <span className="text-xs font-black text-primary uppercase">{property.propertyInfo?.rooms || 0} Units</span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-slate-400">
              <Clock size={12} className="mr-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">Condition</span>
            </div>
            <span className="text-xs font-black text-primary uppercase truncate">{property.propertyInfo?.condition || 'Good'}</span>
          </div>
        </div>

        <div className="mt-8 flex space-x-2">
          <button
            onClick={() => navigate(`/properties/${property._id}`)}
            className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-xl shadow-slate-200"
          >
            Details
          </button>
          <button
            onClick={() => onViewOnMap(property)}
            className="flex-1 bg-white border-2 border-slate-100 text-primary py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition flex items-center justify-center"
          >
            <MapIcon size={14} className="mr-2" /> Map
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-accent transition border border-transparent hover:border-accent">
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PropertyExplorer = ({ defaultView = 'grid' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(defaultView);

  useEffect(() => {
    setViewMode(defaultView);
  }, [defaultView]);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [viewResetTrigger, setViewResetTrigger] = useState(0);
  const [galleryState, setGalleryState] = useState({ isOpen: false, images: [], suburb: '' });

  const openGallery = (images, suburb) => {
    setGalleryState({ isOpen: true, images, suburb });
  };
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get('/properties');
        setProperties(res.data);
        setFilteredProperties(res.data);
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const fetchPropertiesByBounds = useCallback(async (bbox) => {
    try {
      const res = await api.get(`/properties?bbox=${bbox}${typeFilter !== 'All' ? `&propertyType=${typeFilter}` : ''}`);
      // Only update properties, let the useEffect handle filteredProperties for consistency
      setProperties(res.data);
    } catch (err) {
      console.error('Error fetching by bounds:', err);
    }
  }, [typeFilter]);

  useEffect(() => {
    const results = properties.filter(prop => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        (prop.location?.suburb?.toLowerCase()?.includes(searchTermLower)) ||
        (prop.location?.region?.toLowerCase()?.includes(searchTermLower)) ||
        (prop.location?.district?.toLowerCase()?.includes(searchTermLower)) ||
        false;

      const matchesType = typeFilter === 'All' || prop.propertyInfo?.propertyType === typeFilter;

      return matchesSearch && matchesType;
    });
    setFilteredProperties(results);
  }, [searchTerm, typeFilter, properties]);

  const handlePropertySelect = useCallback((id) => {
    const prop = properties.find(p => p._id === id);
    setSelectedProperty(prop);
  }, [properties]);

  const handleBoundsChange = useCallback((bbox) => {
    if (viewMode === 'map') fetchPropertiesByBounds(bbox);
  }, [viewMode, fetchPropertiesByBounds]);

  const handleViewOnMap = (property) => {
    setSelectedProperty(property);
    setViewMode('map');
  };


  return (
    <div className="flex bg-slate-50 h-[100vh] w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full bg-slate-50 min-h-0 min-w-0">
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-6 sticky top-0 z-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight">
                {viewMode === 'map' ? 'Property Map' : 'Property Database'}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                {viewMode === 'map'
                  ? 'Visualise comparable properties across Ghana'
                  : 'Search and filter verified property transaction records'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${viewMode === 'grid' ? 'bg-white text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-xl transition flex items-center space-x-2 ${viewMode === 'map' ? 'bg-white text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <MapIcon size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
                </button>
              </div>

              {(user?.role === 'Admin' || user?.role === 'Valuer') && (
                <button
                  onClick={() => navigate('/submit-property')}
                  className="bg-accent text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-700 transition flex items-center shadow-xl shadow-blue-200"
                >
                  <Plus size={18} className="mr-2" /> Add Record
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col p-4 md:p-8 max-w-[1600px] mx-auto w-full hide-scrollbar">
          {/* Search & Filter Bar - Conditional for Grid View */}
          {viewMode === 'grid' && (
            <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 mb-8 sticky top-0 z-30 slide-in-from-top-4 animate-in">
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by suburb, region or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none text-sm font-medium"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full md:w-auto bg-slate-50 border-none rounded-2xl px-8 py-4 font-bold text-primary focus:ring-2 focus:ring-accent transition outline-none appearance-none "
                >
                  <option value="All">All Types</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Land">Land</option>
                  <option value="Office">Office</option>
                  <option value="Mixed-use">Mixed-use</option>
                  <option value="Industrial">Industrial</option>
                </select>
                <button className="w-full md:w-auto justify-center bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition flex items-center shadow-lg shadow-slate-200 uppercase text-[10px] tracking-widest">
                  <Filter size={16} className="mr-2" /> Filters
                </button>
              </div>
            </div>
          )}

          {/* Type Pills for Map View */}
          {viewMode === 'map' && (
            <div className="flex items-center justify-end space-x-3 mb-8 overflow-x-auto pb-2 hide-scrollbar ">
              {['All', 'Residential', 'Commercial', 'Office', 'Mixed-use', 'Industrial'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type === 'All' ? 'All' : type)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition border-2 ${typeFilter === type || (type === 'All' && typeFilter === 'All')
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200'
                    : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200'
                    }`}
                >
                  {type === 'All' ? 'All Types' : type}
                </button>
              ))}
            </div>
          )}

          {/* Grid or Map View */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
              {filteredProperties.length > 0 ? (
                filteredProperties.map(prop => (
                  <PropertyCard
                    key={prop._id}
                    property={prop}
                    onViewOnMap={handleViewOnMap}
                    onImageClick={openGallery}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">No properties match your filter criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 relative md:h-full md:pb-0">
              {/* Map Container with Overlays */}
              <div className="w-full h-[65vh] min-h-[400px] md:h-full md:flex-1 relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 bg-white group/map shrink-0">
                <MapComponent
                  properties={filteredProperties}
                  onPropertySelect={handlePropertySelect}
                  onBoundsChange={handleBoundsChange}
                  selectedId={selectedProperty?._id}
                  viewResetTrigger={viewResetTrigger}
                  comparableIds={selectedProperty ? filteredProperties
                    .filter(p => p._id !== selectedProperty._id &&
                      p.propertyInfo?.propertyType === selectedProperty.propertyInfo?.propertyType &&
                      Math.abs(p.marketData?.salePrice - selectedProperty.marketData?.salePrice) / selectedProperty.marketData?.salePrice < 0.2
                    )
                    .map(p => p._id) : []}
                />

                {/* Top Left Info Bar - Condensed on Mobile */}
                <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center space-x-2 md:space-x-3 shadow-2xl border border-white/10 z-10 transition-all hover:scale-105">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent rounded-full animate-pulse"></div>
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                    {filteredProperties.length} Properties Mapped
                  </span>
                </div>

                {/* Bottom Left Legend - Collapsible or Hidden on Mobile */}
                <div className="absolute bottom-6 left-6 z-10 flex flex-col">
                  {!showLegend ? (
                    <button
                      onClick={() => setShowLegend(true)}
                      className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center group"
                      title="Show Map Legend"
                    >
                      <MapIcon size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                  ) : (
                    <div className="bg-white/95 backdrop-blur-md p-4 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50 transition-all transform animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Legend</p>
                        <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-slate-700 transition-colors ml-4 p-1 rounded-full hover:bg-slate-100">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { name: 'Residential', color: 'bg-[#1e293b]' },
                          { name: 'Commercial', color: 'bg-[#fbbf24]' },
                          { name: 'Office', color: 'bg-[#0d9488]' },
                          { name: 'Mixed-use', color: 'bg-[#9333ea]' },
                          { name: 'Industrial', color: 'bg-[#dc2626]' },
                          { name: 'Land', color: 'bg-slate-200' }
                        ].map(cat => (
                          <div
                            key={cat.name}
                            onClick={() => setTypeFilter(cat.name)}
                            className={`flex items-center space-x-3 cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition-colors ${typeFilter === cat.name ? 'bg-slate-50 ring-1 ring-slate-200/50' : ''}`}
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${cat.color} flex-shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)] ${typeFilter === cat.name ? 'ring-2 ring-offset-2 ring-slate-200' : ''}`}></div>
                            <span className={`text-[11px] whitespace-nowrap ${typeFilter === cat.name ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{cat.name}</span>
                          </div>
                        ))}
                      </div>
                      {typeFilter !== 'All' && (
                        <button
                          onClick={() => {
                            setTypeFilter('All');
                            setViewResetTrigger(prev => prev + 1);
                          }}
                          className="mt-3 w-full text-center text-[10px] text-slate-500 hover:text-slate-800 font-bold py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Wide View (All)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Property Popup (Floating) - Responsive Adjustment */}
                {selectedProperty && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 w-[calc(100%-2rem)] md:w-72 bg-white/95 backdrop-blur-md rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-5 z-20 animate-in fade-in zoom-in-95 slide-in-from-right-8 duration-300">
                    <button
                      onClick={() => setSelectedProperty(null)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition"
                    >
                      <X size={18} />
                    </button>
                    <div className="mb-3">
                      <span className="text-[9px] bg-accent/10 text-accent px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                        {selectedProperty.propertyInfo?.propertyType}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-primary mb-0.5 leading-tight">{selectedProperty.location?.suburb}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center">
                      <MapPin size={10} className="mr-1" /> {selectedProperty.location?.district}, {selectedProperty.location?.region}
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 mb-5">
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                        <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5 tracking-tighter">Size</p>
                        <p className="text-xs font-black text-primary">{selectedProperty.propertyInfo?.size} sqm</p>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                        <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5 tracking-tighter">Land</p>
                        <p className="text-xs font-black text-primary">{selectedProperty.propertyInfo?.landSize} ac</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Sale Price</p>
                        <p className="text-xl font-black text-primary">GHS {(selectedProperty.marketData?.salePrice / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/properties/${selectedProperty._id}`)}
                        className="flex-1 py-3 bg-slate-900 text-white text-[9px] font-black rounded-xl hover:bg-black transition uppercase tracking-[0.2em] shadow-lg shadow-slate-200"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => navigate('/valuation', { state: { propertyId: selectedProperty._id } })}
                        className="flex-1 py-3 bg-accent text-white text-[9px] font-black rounded-xl hover:bg-blue-700 transition uppercase tracking-[0.2em] shadow-lg shadow-blue-200"
                      >
                        Valuate
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Redesigned Map Sidebar */}
              <aside className="w-full md:w-[320px] h-auto md:h-full shrink-0 flex flex-col gap-5 animate-in fade-in slide-in-from-right-12 duration-700">
                {/* Instruction Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-7 text-white shadow-2xl flex items-center space-x-4 border border-white/5 relative overflow-hidden group/instr">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-accent shrink-0 relative z-10 group-hover/instr:scale-110 transition-transform">
                    <Activity size={24} />
                  </div>
                  <p className="text-[10px] font-black leading-relaxed text-slate-300 uppercase tracking-[0.1em] relative z-10">
                    Click any pin on the map to view property details
                  </p>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl"></div>
                </div>

                {/* List Card */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                  <div className="p-7 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Mapped Properties ({filteredProperties.length})</h3>
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4 hide-scrollbar">
                    {filteredProperties.length > 0 ? (
                      filteredProperties.map(prop => (
                        <div
                          key={prop._id}
                          onClick={() => setSelectedProperty(prop)}
                          className={`p-5 rounded-[2.2rem] transition-all cursor-pointer group flex items-start space-x-4 border-2 ${selectedProperty?._id === prop._id
                            ? 'bg-blue-50/50 border-accent shadow-xl scale-[1.02]'
                            : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'
                            }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${selectedProperty?._id === prop._id
                            ? 'bg-accent text-white shadow-lg shadow-blue-200'
                            : 'bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-accent group-hover:scale-110'
                            }`}>
                            <Home size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1.5">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${prop.propertyInfo?.propertyType === 'Residential' ? 'bg-slate-100 text-slate-600' :
                                prop.propertyInfo?.propertyType === 'Commercial' ? 'bg-amber-50 text-amber-600' :
                                  'bg-blue-50 text-accent'
                                }`}>
                                {prop.propertyInfo?.propertyType}
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                                • {prop.propertyInfo?.condition}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-primary truncate tracking-tight">{prop.location?.suburb}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-3 truncate">
                              {prop.location?.district}, {prop.location?.region}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-base font-black text-primary">GHS {(prop.marketData?.salePrice / 1000).toFixed(0)}K</p>
                              <ChevronRight size={14} className={`transition-transform ${selectedProperty?._id === prop._id ? 'text-accent translate-x-1' : 'text-slate-200 group-hover:text-slate-400'}`} />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No results found</p>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      {/* Gallery Modal */}
      {galleryState.isOpen && (
        <ImageGalleryModal
          images={galleryState.images}
          suburb={galleryState.suburb}
          onClose={() => setGalleryState({ ...galleryState, isOpen: false })}
        />
      )}
    </div>
  );
};

export default PropertyExplorer;
