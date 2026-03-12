import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, BedDouble, Square, Plus, Map as MapIcon, Grid } from 'lucide-react';

const PropertyCard = ({ property }) => (
  <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
    <div className="h-48 bg-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-300 animate-pulse group-hover:hidden"></div>
      <img
        src={property.propertyInfo?.images?.[0] || `https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80&sig=${property._id}`}
        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        alt="Property"
        onLoad={(e) => e.target.previousSibling.style.display = 'none'}
      />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary">
        {property.propertyInfo?.propertyType}
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center text-slate-400 text-xs mb-2">
        <MapPin size={12} className="mr-1" />
        {property.location?.suburb}, {property.location?.region}
      </div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-bold text-primary">GHS {property.marketData?.salePrice?.toLocaleString()}</h4>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 text-slate-500 text-sm">
        <div className="flex items-center space-x-2">
          <BedDouble size={16} />
          <span>{property.propertyInfo?.rooms || 0} Rooms</span>
        </div>
        <div className="flex items-center space-x-2">
          <Square size={16} />
          <span>{property.propertyInfo?.size || 0} sqm</span>
        </div>
      </div>
    </div>
  </div>
);

const PropertyExplorer = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

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

  useEffect(() => {
    const results = properties.filter(prop => {
      const matchesSearch = 
        prop.location?.suburb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location?.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location?.district?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'All' || prop.propertyInfo?.propertyType === typeFilter;
      
      return matchesSearch && matchesType;
    });
    setFilteredProperties(results);
  }, [searchTerm, typeFilter, properties]);


  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-white border-b px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-2xl font-bold text-primary">Property Database</h1>
          <div className="flex items-center space-x-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow text-accent' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition ${viewMode === 'map' ? 'bg-white shadow text-accent' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <MapIcon size={20} />
              </button>
            </div>
            {user?.role === 'Admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-accent text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-200"
              >
                <Plus size={18} className="mr-2" /> Add Property
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 mb-10 sticky top-0 z-30">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by suburb, district, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-accent transition outline-none"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-2xl px-6 py-3 font-medium text-slate-600 focus:ring-2 focus:ring-accent transition outline-none"
              >
                <option value="All">All Types</option>
                <option value="Detached House">Detached House</option>
                <option value="Semi-Detached">Semi-Detached</option>
                <option value="Apartment">Apartment</option>
                <option value="Office">Office</option>
                <option value="Commercial">Commercial</option>
              </select>
              <button className="bg-slate-50 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-100 transition flex items-center border border-slate-100">
                <Filter size={18} className="mr-2" /> Filters
              </button>
            </div>
          </div>

          {/* Grid or Map View */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
              {filteredProperties.length > 0 ? (
                filteredProperties.map(prop => (
                  <PropertyCard key={prop._id} property={prop} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">No properties match your filter criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[calc(100vh-280px)] min-h-[500px] mb-12">
              <MapComponent properties={filteredProperties} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PropertyExplorer;
