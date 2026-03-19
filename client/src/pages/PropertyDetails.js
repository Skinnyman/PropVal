import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import { 
  ArrowLeft, 
  MapPin, 
  Home, 
  Maximize, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Activity,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  FileText,
  Navigation
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

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={48} />
        </main>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <h2 className="text-2xl font-black text-primary mb-4">Property Not Found</h2>
          <button 
            onClick={() => navigate('/properties')}
            className="bg-accent text-white px-8 py-3 rounded-2xl font-black shadow-lg"
          >
            Back to Database
          </button>
        </main>
      </div>
    );
  }

  const priceSqm = property.marketData?.salePrice && property.propertyInfo?.size 
    ? Math.round(property.marketData.salePrice / property.propertyInfo.size) 
    : 0;
  
  const yieldValue = property.marketData?.rentalValue && property.marketData?.salePrice 
    ? ((property.marketData.rentalValue * 12) / property.marketData.salePrice * 100).toFixed(1) 
    : 0;

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80';
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  const propertyImages = property.propertyInfo?.images && property.propertyInfo.images.length > 0 
    ? property.propertyInfo.images 
    : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 sticky top-0 z-40 flex items-center justify-between">
           <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Property Insight</p>
                 <h1 className="text-lg md:text-xl font-black text-primary truncate max-w-xs">{property.location?.suburb}</h1>
              </div>
           </div>
           <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/valuation', { state: { propertyId: property._id } })}
                className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-200"
              >
                <TrendingUp size={16} className="mr-2" /> Valuate This
              </button>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
           {/* Gallery & Quick Specs */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div 
                   className="aspect-[16/10] bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl relative group cursor-pointer"
                   onClick={() => setGalleryOpen(true)}
                 >
                    <img 
                       src={getImageUrl(propertyImages[activeImage])}
                       alt="Property"
                       className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    {propertyImages.length > 1 && (
                       <>
                          <button 
                             onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === 0 ? propertyImages.length - 1 : prev - 1)) }}
                             className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                          >
                             <ChevronLeft size={20} />
                          </button>
                          <button 
                             onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === propertyImages.length - 1 ? 0 : prev + 1)) }}
                             className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                          >
                             <ChevronRight size={20} />
                          </button>
                       </>
                    )}
                    <div className="absolute top-6 left-6 flex flex-col space-y-2">
                       <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                          {property.propertyInfo?.propertyType}
                       </span>
                    </div>
                 </div>
                 <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {propertyImages.map((img, idx) => (
                       <button 
                          key={idx}
                          onClick={() => setActiveImage(idx)}
                          className={`w-24 h-20 rounded-2xl overflow-hidden border-4 transition shrink-0 ${activeImage === idx ? 'border-accent' : 'border-transparent opacity-60'}`}
                       >
                          <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="Property thumbnail" />
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                       <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{property.location?.region} • {property.location?.district}</p>
                          <h2 className="text-3xl font-black text-primary">GHS {property.marketData?.salePrice?.toLocaleString()}</h2>
                       </div>
                       {property.verificationStatus === 'Approved' && (
                          <div className="bg-emerald-50 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center">
                             <CheckCircle size={14} className="mr-2" /> Verified Record
                          </div>
                       )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Built Area</p>
                          <div className="flex items-center text-primary font-black">
                             <Home size={16} className="mr-2 text-accent" />
                             <span>{property.propertyInfo?.size} m²</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rooms</p>
                          <div className="flex items-center text-primary font-black">
                             <Maximize size={16} className="mr-2 text-accent" />
                             <span>{property.propertyInfo?.rooms} Unit</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition</p>
                          <div className="flex items-center text-primary font-black">
                             <Activity size={16} className="mr-2 text-accent" />
                             <span className="truncate">{property.propertyInfo?.condition}</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</p>
                          <div className="flex items-center text-primary font-black">
                             <Clock size={16} className="mr-2 text-accent" />
                             <span>{property.propertyInfo?.yearBuilt || 'N/A'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-8">
                       <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <TrendingUp size={14} className="mr-2 text-emerald-500" /> Rental Yield
                          </p>
                          <p className="text-2xl font-black text-emerald-500">{yieldValue}% <span className="text-xs text-slate-400">/ Year</span></p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <DollarSign size={14} className="mr-2 text-accent" /> Market Rate
                          </p>
                          <p className="text-2xl font-black text-accent">GHS {priceSqm.toLocaleString()} <span className="text-xs text-slate-400">/ m²</span></p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center">
                       <FileText size={18} className="mr-3 text-accent" /> Source Reference
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                       {property.dataSourceReference || "No reference provided for this confidential record."}
                    </p>
                    <div className="flex items-center space-x-6 text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">
                       <div className="flex items-center"><Calendar size={14} className="mr-2" /> {new Date(property.marketData?.transactionDate).toLocaleDateString()}</div>
                       <div className="flex items-center"><MapPin size={14} className="mr-2" /> GPS Verified</div>
                    </div>

                     {property.location?.coordinates?.coordinates && property.location.coordinates.coordinates.length === 2 && (
                        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center gap-4">
                           <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center space-x-4 w-fit">
                              <div className="flex flex-col">
                                 <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-0.5">Latitude</span>
                                 <span className="text-white text-xs font-black font-mono tracking-wider">{property.location.coordinates.coordinates[1].toFixed(6)}</span>
                              </div>
                              <div className="w-px h-6 bg-white/10"></div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-0.5">Longitude</span>
                                 <span className="text-white text-xs font-black font-mono tracking-wider">{property.location.coordinates.coordinates[0].toFixed(6)}</span>
                              </div>
                           </div>
                           <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${property.location.coordinates.coordinates[1]},${property.location.coordinates.coordinates[0]}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-accent text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 md:ml-auto w-full md:w-auto"
                           >
                              <Navigation size={14} className="mr-2" /> Get Directions
                           </a>
                        </div>
                     )}
                  </div>
               </div>
           </div>

           {/* Location context */}
           <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl h-[400px]">
              <MapComponent 
                properties={[property]} 
                selectedId={property._id}
                initialCenter={property.location?.coordinates?.coordinates}
                initialZoom={15}
              />
           </div>
        </div>
      </main>

      {/* Full Screen Gallery */}
      {galleryOpen && (
        <ImageGalleryModal 
           images={propertyImages} 
           suburb={property.location?.suburb} 
           onClose={() => setGalleryOpen(false)} 
        />
      )}
    </div>
  );
};

export default PropertyDetails;
