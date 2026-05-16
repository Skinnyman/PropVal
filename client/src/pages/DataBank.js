import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  HardHat,
  Box,
  Wrench,
  Percent,
  Map,
  Home,
  Upload,
  BarChart3,
  Globe,
  X,
  Menu,
  Info,
  Search,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  FileUp,
  Table,
  Loader2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { AuthContext } from '../context/AuthContext';

const Papa = window.Papa;
const ContributionForm = ({ type, editingData, onBack, onSubmit, onSubmitBulk, setBulkSuccessSummary }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'bulk'
  
  // Bulk Setup
  const [sheetUrl, setSheetUrl] = useState('');
  const [bulkData, setBulkData] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Google Sheets Multi-Tab States
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [syncingGlobally, setSyncingGlobally] = useState(false);
  const [globalSyncMsg, setGlobalSyncMsg] = useState('');

  useEffect(() => {
    if (isAdmin && activeTab === 'bulk') {
      api.get('/market-data/google-sheets/config')
        .then(res => {
          if (res.data) setGlobalConfig(res.data);
        })
        .catch(err => console.error(err));
    }
  }, [isAdmin, activeTab]);

  const saveGlobalConfig = async (url) => {
    try {
      setMetadataLoading(true);
      const res = await api.post('/market-data/google-sheets/config', { url });
      setGlobalConfig(res.data.value);
      setBulkSuccessSummary('Global Google Sheets URL saved successfully. Auto-sync is now active.');
      setSheetUrl('');
    } catch (err) {
      setBulkError(err.response?.data?.msg || 'Failed to save global configuration.');
    } finally {
      setMetadataLoading(false);
    }
  };

  const triggerGlobalSync = async () => {
    try {
      setSyncingGlobally(true);
      setGlobalSyncMsg('');
      const res = await api.post('/market-data/google-sheets/auto-sync');
      setGlobalSyncMsg(res.data.msg);
    } catch (err) {
      setBulkError(err.response?.data?.msg || 'Failed to trigger global auto-sync.');
    } finally {
      setSyncingGlobally(false);
    }
  };

  const saveTabMapping = async () => {
    try {
      setMetadataLoading(true);
      const res = await api.post('/market-data/google-sheets/config/mapping', {
        category: type,
        sheetName: selectedSheet
      });
      setGlobalConfig(res.data.value);
      setBulkSuccessSummary(`Tab '${selectedSheet}' is now auto-synced for ${type}.`);
    } catch (err) {
      setBulkError(err.response?.data?.msg || 'Failed to save tab mapping.');
    } finally {
      setMetadataLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    region: editingData?.region || '', 
    city: editingData?.city || '', 
    area: editingData?.area || '', 
    propertyType: editingData?.propertyType || '',
    landSize: editingData?.landSize || '', 
    buildingSize: editingData?.buildingSize || '', 
    yearBuilt: editingData?.yearBuilt || '', 
    rent: editingData?.rent || '', 
    rentBasis: editingData?.rentBasis || '', 
    occupancy: editingData?.occupancy || '',
    cost: editingData?.cost || '', 
    gfa: editingData?.gfa || '', 
    spec: editingData?.spec || '', 
    completionDate: editingData?.completionDate || '',
    materialName: editingData?.materialName || '', 
    materialPrice: editingData?.materialPrice || '', 
    materialUnit: editingData?.materialUnit || '', 
    supplier: editingData?.supplier || '',
    capRate: editingData?.capRate || '', 
    annualRent: editingData?.annualRent || '', 
    propertyValue: editingData?.propertyValue || '', 
    leaseType: editingData?.leaseType || '',
    source: editingData?.source || '', 
    notes: editingData?.notes || '', 
    subCategory: editingData?.subCategory || '',
    declared: false, 
    declaredBulk: false
  });

  useEffect(() => {
    if (editingData) setActiveTab('manual');
  }, [editingData]);

  const normalizeBulkData = (data, category) => {
    return data.map(row => {
      // Create a lowercase, no-spaces version of the keys for matching
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        normalizedRow[cleanKey] = row[key];
      });

      // Based on the selected category, extract the specific fields
      // Common fields
      const newObj = {
        region: normalizedRow.region || '',
        city: normalizedRow.city || normalizedRow.town || '',
        area: normalizedRow.area || normalizedRow.suburb || '',
        propertyType: normalizedRow.propertytype || normalizedRow.type || normalizedRow.category || '',
        source: normalizedRow.source || normalizedRow.reference || '',
        notes: normalizedRow.notes || normalizedRow.comments || ''
      };

      if (category === 'Sale Transactions') {
        newObj.price = normalizedRow.price || normalizedRow.saleprice || normalizedRow.value || '';
        newObj.saleDate = normalizedRow.saledate || normalizedRow.date || '';
        newObj.landSize = normalizedRow.landsize || normalizedRow.plot || '';
        newObj.buildingSize = normalizedRow.buildingsize || normalizedRow.gfa || '';
      } else if (category === 'Land Values') {
        newObj.price = normalizedRow.price || normalizedRow.value || '';
        newObj.landSize = normalizedRow.landsize || normalizedRow.size || '';
        newObj.zoning = normalizedRow.zoning || normalizedRow.landuse || '';
        newObj.tenure = normalizedRow.tenure || normalizedRow.tenuretype || '';
      } else if (category === 'Rental Evidence') {
        newObj.landSize = normalizedRow.landsize || normalizedRow.plot || '';
        newObj.buildingSize = normalizedRow.buildingsize || normalizedRow.gfa || '';
        newObj.yearBuilt = normalizedRow.yearbuilt || normalizedRow.year || '';
        newObj.rent = normalizedRow.rent || normalizedRow.price || '';
        newObj.rentBasis = normalizedRow.rentbasis || normalizedRow.basis || '';
        newObj.occupancy = normalizedRow.occupancy || normalizedRow.occupancyrate || '';
      } else if (category === 'Construction Costs') {
        newObj.cost = normalizedRow.cost || normalizedRow.totalcost || normalizedRow.price || '';
        newObj.gfa = normalizedRow.gfa || normalizedRow.area || '';
        newObj.spec = normalizedRow.spec || normalizedRow.specification || '';
        newObj.completionDate = normalizedRow.completiondate || normalizedRow.date || '';
      } else if (category === 'Building Materials') {
        newObj.subCategory = normalizedRow.category || normalizedRow.subcategory || '';
        newObj.materialName = normalizedRow.materialname || normalizedRow.material || normalizedRow.name || '';
        newObj.materialPrice = normalizedRow.materialprice || normalizedRow.price || '';
        newObj.materialUnit = normalizedRow.materialunit || normalizedRow.unit || '';
        newObj.supplier = normalizedRow.supplier || normalizedRow.source || '';
      } else if (category === 'Cap Rates / Yields') {
        newObj.capRate = normalizedRow.caprate || normalizedRow.yield || '';
        newObj.annualRent = normalizedRow.annualrent || normalizedRow.rent || '';
        newObj.propertyValue = normalizedRow.propertyvalue || normalizedRow.value || '';
        newObj.leaseType = normalizedRow.leasetype || normalizedRow.lease || '';
      }
      return newObj;
    });
  };

  const getFormTitle = () => {
    switch (type) {
      case 'Sale Transactions': return 'Sale Transaction';
      case 'Rental Evidence': return 'Rental Evidence';
      case 'Construction Costs': return 'Construction Cost';
      case 'Land Values': return 'Land Transaction';
      case 'Cap Rates / Yields': return 'Cap Rate Evidence';
      case 'Building Materials': return 'Material Price Update';
      default: return 'Data Record';
    }
  };

  const getPropertyTypeOptions = () => {
    switch (type) {
      case 'Construction Costs':
        return ['Single Family Residential', 'Multi-Family Residential', 'Office Building', 'Commercial Mall', 'Warehouse / Industrial'];
      case 'Land Values':
        return ['Serviced Plot', 'Undeveloped Land', 'Agricultural / Farm Land', 'Brownfield Site'];
      case 'Building Materials':
        return ['General Construction', 'Finishing', 'Electrical', 'Plumbing', 'Roofing', 'Masonry'];
      default:
        // Sale, Rental, Cap Rates
        return ['Residential', 'Commercial', 'Office', 'Retail', 'Industrial', 'Mixed-Use'];
    }
  };

  const regions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
    'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
    'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-accent transition-colors group">
          <ChevronLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        <div className="w-px h-4 bg-slate-200"></div>
        <h3 className="text-sm font-black text-primary uppercase tracking-widest">Step 2: Submit {getFormTitle()} Evidence</h3>
      </div>

      <div className="flex space-x-2 mb-8">
        {isAdmin ? (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-max">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bulk' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Bulk Upload
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('manual')}
            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-primary shadow-sm"
          >
            {editingData ? 'Edit Resubmission' : 'Manual Entry'}
          </button>
        )}
      </div>

      {activeTab === 'manual' ? (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-12 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-12">
          {/* Common Fields */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Region</label>
            <div className="relative">
              <select
                className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm appearance-none"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              >
                <option value="">— Select Region —</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">City / Town</label>
            <input
              className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
              placeholder="e.g. Accra"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Area / Suburb</label>
            <input
              className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
              placeholder="e.g. East Legon"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Property Type / Category</label>
            <div className="relative">
              <select
                className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm appearance-none"
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
              >
                <option value="">— Select Type —</option>
                {getPropertyTypeOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            </div>
          </div>

          {/* Specific Fields: Sale Transaction */}
          {type === 'Sale Transactions' && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sale Price (GHS)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 1,200,000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date of Sale</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="DD/MM/YYYY"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Land Size (sq. m)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 450"
                  value={formData.landSize}
                  onChange={(e) => setFormData({ ...formData, landSize: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Building Size (sq. m)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 320"
                  value={formData.buildingSize}
                  onChange={(e) => setFormData({ ...formData, buildingSize: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Specific Fields: Land Transaction */}
          {type === 'Land Values' && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Land Value / Price (GHS)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 450,000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Land Size (Acres / Sqm)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 2.5 Acres"
                  value={formData.landSize}
                  onChange={(e) => setFormData({ ...formData, landSize: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Zoning / Land Use</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="Residential / Commercial"
                  value={formData.zoning}
                  onChange={(e) => setFormData({ ...formData, zoning: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tenure Type</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="Leasehold / Freehold"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Specific Fields: Rental */}
          {type === 'Rental Evidence' && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Land Size (sq. m or acres)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 500"
                  value={formData.landSize}
                  onChange={(e) => setFormData({ ...formData, landSize: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Building Size (sq. m)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 280"
                  value={formData.buildingSize}
                  onChange={(e) => setFormData({ ...formData, buildingSize: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Year Built</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 2018"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly/Annual Rent (GHS)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 12,000"
                  value={formData.rent}
                  onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rental Basis</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="monthly / annual"
                  value={formData.rentBasis}
                  onChange={(e) => setFormData({ ...formData, rentBasis: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Occupancy Rate (%)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 95"
                  value={formData.occupancy}
                  onChange={(e) => setFormData({ ...formData, occupancy: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Specific Fields: Construction */}
          {type === 'Construction Costs' && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Construction Cost (GHS)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 850,000"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">GFA (sq. m)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 280"
                  value={formData.gfa}
                  onChange={(e) => setFormData({ ...formData, gfa: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Specification</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="Basic / Standard / Luxury / Grade A"
                  value={formData.spec}
                  onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Completion Date</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="MM/YYYY"
                  value={formData.completionDate}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Specific Fields: Material */}
          {type === 'Building Materials' && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Category</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. Finishing, Plumbing"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Name</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. Cement (32.5R)"
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">materialPrice (GHS)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 115"
                  value={formData.materialPrice}
                  onChange={(e) => setFormData({ ...formData, materialPrice: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. Per 50Kg bag"
                  value={formData.materialUnit}
                  onChange={(e) => setFormData({ ...formData, materialUnit: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Supplier / Source</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. GHACEM, local dealer"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Specific Fields: Cap Rate */}
          {type === 'Cap Rates / Yields' && (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cap Rate (%)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 8.5"
                  value={formData.capRate}
                  onChange={(e) => setFormData({ ...formData, capRate: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Annual Rent (GHS)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 850,000"
                  value={formData.annualRent}
                  onChange={(e) => setFormData({ ...formData, annualRent: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Property Value (GHS)</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="e.g. 10,000,000"
                  value={formData.propertyValue}
                  onChange={(e) => setFormData({ ...formData, propertyValue: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lease Type</label>
                <input
                  className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
                  placeholder="Full repairing / Gross / Net"
                  value={formData.leaseType}
                  onChange={(e) => setFormData({ ...formData, leaseType: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="space-y-3 col-span-full md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Source / Reference</label>
            <input
              className="w-full bg-slate-50/50 border border-slate-100 py-3.5 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm"
              placeholder="Valuation report, agent name, legal document"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
          </div>

          <div className="space-y-3 col-span-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes / Comments</label>
            <textarea
              className="w-full bg-slate-50/50 border border-slate-100 py-4 px-4 rounded-[1.5rem] outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm min-h-[120px]"
              placeholder="Any additional context"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {editingData && editingData.rejectionReason && (
          <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest mb-2">Admin Feedback / Rejection Reason:</p>
            <p className="text-rose-800 text-xs font-bold leading-relaxed">{editingData.rejectionReason}</p>
          </div>
        )}

        <div className="bg-slate-50/80 rounded-[1.5rem] p-6 mb-10 border border-slate-100/50 group hover:border-accent transition-colors">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="declaration"
              className="mt-1 w-4 h-4 rounded border-slate-200 text-accent focus:ring-accent cursor-pointer"
              checked={formData.declared}
              onChange={(e) => setFormData({ ...formData, declared: e.target.checked })}
            />
            <label htmlFor="declaration" className="ml-4 text-[10px] font-bold text-slate-500 leading-relaxed cursor-pointer select-none group-hover:text-primary transition-colors">
              <span className="text-primary uppercase tracking-widest font-black mr-2">Professional Declaration:</span>By submitting, I confirm this data is based on real, market evidence obtained in my professional capacity as a valuer or property professional. I understand that submitting false or misleading data is a breach of professional standards and may result in my account being suspended.
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            disabled={!formData.declared}
            onClick={() => onSubmit(formData)}
            className="bg-[#d4a017] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-2xl shadow-yellow-800/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
          >
            {editingData ? 'Resubmit Edits' : 'Submit Data Record'}
          </button>
          <button onClick={onBack} className="px-8 py-4 border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all">
            Cancel
          </button>
        </div>
      </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-12 shadow-sm">
          <div className="mb-10 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Table size={28} />
            </div>
            <h3 className="text-xl font-black text-primary mb-3">Bulk Import via Google Sheets</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Link a published Google Sheet or upload a CSV file to instantly import hundreds of records into the <span className="font-bold text-slate-800">{type}</span> database.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Link Option */}
            <div className="bg-slate-50 p-8 rounded-[1.5rem] border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 text-slate-800 mb-4">
                  <LinkIcon size={18} className="text-blue-500" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Paste Published URL</h4>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mb-6 leading-relaxed">
                  Go to your Google Sheet <span className="font-bold text-slate-600">&gt; File &gt; Share &gt; Publish to web</span>. Select <span className="font-bold text-slate-600">CSV</span> and paste the link below.
                </p>
                <div className="space-y-4">
                  {globalConfig ? (
                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm animate-in fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">Active Source</span>
                        <button onClick={() => setGlobalConfig(null)} className="text-[10px] text-red-500 font-bold hover:underline">Replace URL</button>
                      </div>
                      <p className="text-xs text-slate-700 font-medium truncate mb-2" title={globalConfig.url}>{globalConfig.url}</p>
                      {globalConfig.mappings && globalConfig.mappings[type] && (
                        <div className="mb-4 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center">
                          <CheckCircle2 size={12} className="mr-2" /> Mapped Tab: {globalConfig.mappings[type]}
                        </div>
                      )}
                      <button
                        onClick={triggerGlobalSync}
                        disabled={syncingGlobally}
                        className="w-full bg-[#10b981] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        {syncingGlobally ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />} Sync All Tabs Now
                      </button>
                      {globalSyncMsg && <p className="text-[10px] text-emerald-600 font-bold mt-3 text-center">{globalSyncMsg}</p>}
                    </div>
                  ) : (
                    <>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full bg-white border border-slate-200 py-3.5 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-xs shadow-sm"
                        value={sheetUrl}
                        onChange={(e) => {
                          setSheetUrl(e.target.value);
                          setAvailableSheets([]);
                          setSpreadsheetId('');
                        }}
                      />
                      {availableSheets.length === 0 ? (
                        <div className="space-y-2">
                          <button
                            onClick={async () => {
                              if (!sheetUrl) return setBulkError('Please enter a valid URL');
                              setMetadataLoading(true); setBulkError('');
                              try {
                                const res = await api.get(`/market-data/google-sheets/metadata?url=${encodeURIComponent(sheetUrl)}`);
                                setAvailableSheets(res.data.availableSheets);
                                setSpreadsheetId(res.data.spreadsheetId);
                                if (res.data.availableSheets.length > 0) {
                                  setSelectedSheet(res.data.availableSheets[0].title);
                                }
                              } catch (err) {
                                setBulkError(err.response?.data?.msg || 'Failed to scan spreadsheet. Check your URL and permissions.');
                              } finally {
                                setMetadataLoading(false);
                              }
                            }}
                            disabled={metadataLoading || !sheetUrl}
                            className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {metadataLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Search size={16} className="mr-2" />} Scan Spreadsheet
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => saveGlobalConfig(sheetUrl)}
                              disabled={metadataLoading || !sheetUrl}
                              className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                              {metadataLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />} Save as Global Auto-Sync URL
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Data Sheet / Tab</label>
                        <select
                          className="w-full bg-white border border-blue-200 py-3.5 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs text-blue-700 shadow-sm"
                          value={selectedSheet}
                          onChange={(e) => setSelectedSheet(e.target.value)}
                        >
                          {availableSheets.map((s, idx) => (
                            <option key={idx} value={s.title}>{s.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col space-y-3">
                        <button
                          onClick={async () => {
                            setBulkLoading(true); setBulkError('');
                            try {
                              const res = await api.post('/market-data/google-sheets/fetch', {
                                spreadsheetId,
                                sheetName: selectedSheet
                              });
                              
                              // 4. FRONTEND IMPLEMENTATION: Parse CSV string returned from backend
                              Papa.parse(res.data.csvData, {
                                header: true,
                                skipEmptyLines: true,
                                complete: (results) => {
                                  if (!results.data || results.data.length === 0) {
                                    setBulkError(`The sheet was fetched, but no valid data rows were found below the headers. (API returned ${res.data.rawRowsLength} total row(s))`);
                                    setBulkLoading(false);
                                    return;
                                  }
                                  const normalized = normalizeBulkData(results.data, type);
                                  setBulkData(normalized);
                                  setBulkLoading(false);
                                },
                                error: (err) => {
                                  setBulkError('Failed to parse the normalized CSV string from Google Sheets.');
                                  setBulkLoading(false);
                                }
                              });
                            } catch (err) {
                              console.error("Bulk Import Error:", err);
                              setBulkError(err.response?.data?.msg || err.message || 'Failed to fetch data from selected sheet.');
                              setBulkLoading(false);
                            }
                          }}
                          disabled={bulkLoading}
                          className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {bulkLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <LinkIcon size={16} className="mr-2" />} Fetch Data from Sheet
                        </button>

                        {isAdmin && (
                          <button
                            onClick={saveTabMapping}
                            disabled={metadataLoading || !selectedSheet}
                            className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            {metadataLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />} Save as Auto-Sync Tab for {type}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </div>
              </div>
            </div>

            {/* File Option */}
            <div className="bg-slate-50 p-8 rounded-[1.5rem] border border-slate-100 border-dashed flex flex-col justify-center items-center text-center">
              <input
                type="file"
                accept=".csv"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setBulkLoading(true); setBulkError('');
                  Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                      const normalized = normalizeBulkData(results.data, type);
                      setBulkData(normalized);
                      setBulkLoading(false);
                    },
                    error: (err) => {
                      setBulkError('Failed to parse file.');
                      setBulkLoading(false);
                    }
                  });
                }}
              />
              <label htmlFor="file-upload" className="cursor-pointer group flex flex-col items-center">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-200 transition-all mb-4 shadow-sm group-hover:scale-105">
                  <FileUp size={24} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-2">Upload CSV File</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px]">Instead of a live link, download your sheet as a CSV and select it here.</p>
              </label>
            </div>
          </div>

          {bulkError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold text-center">
              {bulkError}
            </div>
          )}

          {bulkData.length > 0 && (
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest">Preview: {bulkData.length} records found</h4>
                <button onClick={() => setBulkData([])} className="text-[10px] text-slate-400 font-bold hover:text-rose-500 uppercase">Clear Data</button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto max-h-[300px] overflow-y-auto shadow-inner">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      {Object.keys(bulkData[0]).map((key, idx) => (
                        <th key={idx} className="px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-[9px]">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {Object.values(row).map((val, idx) => (
                          <td key={idx} className="px-4 py-3 text-slate-600 font-medium text-[10px] truncate max-w-[150px]">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bulkData.length > 10 && <p className="text-center text-[10px] text-slate-400 mt-3 font-bold">Showing first 10 rows</p>}

              <div className="mt-8 bg-emerald-50/50 rounded-[1.5rem] p-6 border border-emerald-100 group transition-colors">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="declarationBulk"
                    className="mt-1 w-4 h-4 rounded border-slate-200 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                    checked={formData.declaredBulk}
                    onChange={(e) => setFormData({ ...formData, declaredBulk: e.target.checked })}
                  />
                  <label htmlFor="declarationBulk" className="ml-4 text-[10px] font-bold text-slate-600 leading-relaxed cursor-pointer select-none group-hover:text-primary transition-colors">
                    <span className="text-emerald-700 uppercase tracking-widest font-black mr-2">Bulk Declaration:</span>By submitting this sheet, I confirm all {bulkData.length} records are based on verified market evidence obtained professionally.
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  disabled={!formData.declaredBulk}
                  onClick={() => onSubmitBulk(bulkData, spreadsheetId, selectedSheet)}
                  className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  Import {bulkData.length} Records
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MySubmissionsList = ({ onEdit }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMine = async () => {
      try {
        const res = await api.get('/market-data/mine');
        setSubmissions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMine();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
        <p className="text-slate-400 font-bold text-sm">You haven't submitted any data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
      <h3 className="text-lg font-black text-primary mb-6">My Submissions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Category</th>
              <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Details</th>
              <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Status</th>
              <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Submitted</th>
              <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map(sub => (
              <tr key={sub._id} className="hover:bg-slate-50/50">
                <td className="px-4 py-4 text-slate-800 font-bold">{sub.category}</td>
                <td className="px-4 py-4 text-slate-500 max-w-[200px] truncate">
                  {sub.city} {sub.area} {sub.price ? `- ${sub.price}` : ''} {sub.cost ? `- ${sub.cost}` : ''}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                    sub.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    sub.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {sub.status}
                  </span>
                  {sub.status === 'rejected' && (
                    <div className="mt-2 text-[10px] text-rose-500 font-medium whitespace-normal leading-relaxed max-w-[250px] bg-rose-50 p-2 rounded border border-rose-100">
                      <strong>Reason:</strong> {sub.rejectionReason}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-slate-400 font-medium">
                  {new Date(sub.updatedAt || sub.createdAt || new Date()).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  {sub.status === 'rejected' && (
                    <button
                      onClick={() => onEdit(sub)}
                      className="text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 uppercase tracking-widest px-4 py-2 rounded-lg transition-colors border border-rose-200"
                    >
                      Fix & Resubmit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UploadDashboard = ({ onSelect, onEditSubmission }) => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'mine'
  const contributionCards = [
    {
      id: 'Sale Transactions',
      title: 'Sale Transaction',
      desc: 'A confirmed property sale with price evidence',
      icon: Home,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'Rental Evidence',
      title: 'Rental Evidence',
      desc: 'Achieved or agreed rental rate for a property',
      icon: BarChart3,
      color: 'bg-teal-50 text-teal-600'
    },
    {
      id: 'Construction Costs',
      title: 'Construction Cost',
      desc: 'Actual cost of a completed construction project',
      icon: HardHat,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      id: 'Land Values',
      title: 'Land Transaction',
      desc: 'Base land sale with location and price',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'Cap Rates / Yields',
      title: 'Cap Rate Evidence',
      desc: 'Market yield derived from a verified transaction',
      icon: TrendingUp,
      color: 'bg-rose-50 text-rose-600'
    },
    {
      id: 'Building Materials',
      title: 'Material Price Update',
      desc: 'Current retail price for a building material',
      icon: Wrench,
      color: 'bg-emerald-50 text-emerald-600'
    }
  ];

  const whyContribute = [
    { title: 'Access more entries', desc: 'The more you contribute, the more you unlock. Premium access for top contributors.' },
    { title: 'Strengthen the profession', desc: 'A shared database makes every valuer\'s work more defensible and accurate.' },
    { title: 'Build your reputation', desc: 'Verified contributors earn professional recognition within the PropVal GH network.' },
    { title: 'Improve accuracy', desc: 'Your real evidence replaces estimates — better data for everyone in Ghana.' }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 px-2 flex items-center space-x-4">
        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-accent shadow-sm">
          <Upload size={20} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Upload Property Data</h2>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Contribute evidence to the national property database</p>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-[2.5rem] p-10 mb-12 text-white relative overflow-hidden shadow-2xl">
        <h4 className="text-sm font-black text-[#facc15] uppercase tracking-widest mb-10">Why contribute your data?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyContribute.map((item, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center space-x-2 text-[#facc15]">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.title}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed opacity-80">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-100 px-2 ml-2">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          New Submission
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'mine' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          My Submissions
        </button>
      </div>

      {activeTab === 'mine' ? (
        <div className="px-2">
          <MySubmissionsList onEdit={onEditSubmission} />
        </div>
      ) : (
        <div className="px-2">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-8">Step 1: What type of data are you submitting?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contributionCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onSelect(card.id)}
              className="flex items-start p-6 bg-white border border-slate-100 rounded-[1.5rem] hover:border-accent hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 text-left group"
            >
              <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center mr-5 shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                <card.icon size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-primary mb-1 tracking-tight">{card.title}</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Map string icon names to Lucide icons
const iconMap = {
  TrendingUp,
  TrendingDown,
  HardHat,
  Box,
  Wrench,
  Percent,
  Map,
  Home,
  BarChart3,
  Globe,
  FileText
};

const SnapshotCard = ({ title, value, unit, change, changeText, iconName, trend }) => {
  const Icon = iconMap[iconName] || BarChart3;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-slate-200 hover:shadow-md transition-all h-[110px]">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] break-words leading-[1.4] max-w-[65%]">{title}</p>
        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${trend === 'up' ? 'bg-rose-50 text-rose-500' : trend === 'down' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
          <Icon size={12} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline space-x-1 mb-1.5">
          <h4 className={`text-2xl font-black tracking-tight leading-none ${trend === 'up' ? 'text-rose-600' : trend === 'down' ? 'text-emerald-600' : 'text-blue-600'}`}>{value}</h4>
          <span className="text-[10px] font-bold text-slate-400">{unit}</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-1">
          <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">{changeText}</p>
          {change && (
            <div className={`flex items-center space-x-0.5 text-[8px] font-black uppercase tracking-wider ${trend === 'up' ? 'text-rose-500' : trend === 'down' ? 'text-emerald-500' : 'text-blue-500'}`}>
              {trend === 'up' ? <TrendingUp size={9} strokeWidth={3} /> : trend === 'down' ? <TrendingDown size={9} strokeWidth={3} /> : <TrendingUp size={9} strokeWidth={3} className="rotate-45" />}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const UnifiedDataTable = ({ category, data, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#facc15] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getSubCatColor = (sub) => {
    switch (sub) {
      case 'Residential': case 'kitchen': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Office': case 'bathroom': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'Commercial': case 'Doors & Windows': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getSpecColor = (spec) => {
    if (!spec) return '';
    const s = spec.toLowerCase();
    if (s.includes('luxury') || s.includes('prestige') || s.includes('premium')) return 'bg-rose-50 text-rose-600';
    if (s.includes('quality') || s.includes('mid-range')) return 'bg-amber-50 text-amber-600';
    if (s.includes('standard') || s.includes('grade a')) return 'bg-emerald-50 text-emerald-600';
    return 'bg-slate-100 text-slate-500';
  };

  const renderHeaders = () => {
    switch (category) {
      case 'Sale Transactions':
        return (
          <>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Property Type</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Region</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Sale Price (GHS)</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date / Notes</th>
          </>
        );
      case 'Construction Costs':
        return (
          <>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type / GFA</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Spec</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Region</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cost (GHS)</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Date / Period</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
          </>
        );
      case 'Building Materials':
        return (
          <>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Material Name</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Material Price (GHS)</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Unit</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Region</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
          </>
        );
      case 'Cap Rates / Yields':
        return (
          <>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Property Type</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cap Rate</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Value / Rent</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Lease Type</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
          </>
        );
      case 'Land Values':
        return (
          <>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Location / Area</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Region</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Zoning</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Price / Value (GHS)</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tenure / Notes</th>
          </>
        );
      case 'Rental Evidence':
        return (
          <>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Property Type</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Region</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Rent (GHS)</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Basis / Occ.</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
          </>
        );
      default:
        return (
          <>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Value</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Period</th>
            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
          </>
        );
    }
  };

  const renderCells = (item) => {
    switch (category) {
      case 'Sale Transactions':
        return (
          <>
            <td className="px-6 py-5 font-bold text-primary text-xs">{item.propertyType || item.title || '-'}</td>
            <td className="px-6 py-5 text-slate-500 text-xs font-medium">{item.area && item.city ? `${item.area}, ${item.city}` : item.location || '-'}</td>
            <td className="px-6 py-5 text-slate-400 text-xs font-medium">{item.region || '-'}</td>
            <td className="px-6 py-5 text-center font-black text-[#d4a017] text-xs">
              {item.price ? `GHS ${Number(item.price).toLocaleString()}` : (item.minPrice ? `GHS ${item.minPrice.toLocaleString()}` : '-')}
            </td>
            <td className="px-6 py-5 text-center text-slate-500 text-[10px] font-medium tracking-tight">
              {item.buildingSize ? <span className="block mb-1">Bldg: {item.buildingSize} sqm</span> : ''}
              {item.landSize ? <span>Land: {item.landSize}</span> : ''}
            </td>
            <td className="px-6 py-5 max-w-xs text-[10px] text-slate-400 italic leading-relaxed">
              {item.saleDate ? <span className="font-bold text-slate-500 block mb-1">Sold: {item.saleDate}</span> : ''}
              {item.notes}
            </td>
          </>
        );
      case 'Construction Costs':
        return (
          <>
            <td className="px-6 py-5 font-bold text-primary text-xs">{item.title || item.propertyType || '-'} {item.gfa ? <span className="block text-[9px] font-medium text-slate-400 uppercase mt-1">GFA: {item.gfa} sqm</span> : ''}</td>
            <td className="px-6 py-5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getSpecColor(item.spec)}`}>{item.spec || '-'}</span></td>
            <td className="px-6 py-5 text-slate-500 text-xs font-medium">{item.region || '-'}</td>
            <td className="px-6 py-5 text-center font-black text-[#d4a017] text-xs">GHS {item.cost ? Number(item.cost).toLocaleString() : (item.minPrice ? `${item.minPrice.toLocaleString()} - ${item.maxPrice.toLocaleString()}` : '-')}</td>
            <td className="px-6 py-5 text-center text-slate-400 text-xs font-bold">{item.completionDate || item.period || '-'}</td>
            <td className="px-6 py-5 max-w-xs text-[10px] text-slate-400 italic leading-relaxed">{item.notes}</td>
          </>
        );
      case 'Building Materials':
        return (
          <>
            <td className="px-6 py-5 font-bold text-primary text-xs">{item.materialName || item.title || '-'}</td>
            <td className="px-6 py-5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.subCategory || item.propertyType || '-'}</td>
            <td className="px-6 py-5 font-black text-[#d4a017] text-xs">GHS {item.materialPrice ? Number(String(item.materialPrice).replace(/[^\d.-]/g, '')).toLocaleString() : (item.minPrice ? `${item.minPrice.toLocaleString()} - ${item.maxPrice.toLocaleString()}` : '-')}</td>
            <td className="px-6 py-5 text-center text-slate-500 text-xs font-bold">{item.materialUnit || item.unit || '-'}</td>
            <td className="px-6 py-5 text-slate-600 text-[10px] font-bold uppercase tracking-widest">{item.supplier || item.spec || '-'}</td>
            <td className="px-6 py-5 text-center text-slate-500 text-[10px]">{item.region || item.city || '-'}</td>
            <td className="px-6 py-5 max-w-xs text-[10px] text-slate-400 italic leading-relaxed">{item.notes}</td>
          </>
        );
      case 'Cap Rates / Yields':
        return (
          <>
            <td className="px-6 py-5 font-bold text-primary text-xs">{item.propertyType || item.title || '-'}</td>
            <td className="px-6 py-5 text-slate-500 text-xs font-medium">{item.area && item.city ? `${item.area}, ${item.city}` : item.location || '-'}</td>
            <td className="px-6 py-5 text-center font-black text-[#d4a017] text-xs">{item.capRate ? `${item.capRate}%` : (item.minPrice ? `${item.minPrice}% - ${item.maxPrice}%` : '-')}</td>
            <td className="px-6 py-5 text-center text-emerald-600 text-xs font-black">
              {item.propertyValue ? `Val: ${Number(item.propertyValue).toLocaleString()}` : (item.multiplier ? `${item.multiplier} YP` : '-')}
              {item.annualRent ? <span className="block text-slate-400 text-[9px] mt-1 font-medium">Rent: {Number(item.annualRent).toLocaleString()}</span> : ''}
            </td>
            <td className="px-6 py-5 text-center text-slate-400 text-[10px] font-bold uppercase">{item.leaseType || item.period || '-'}</td>
            <td className="px-6 py-5 max-w-xs text-[10px] text-slate-400 italic leading-relaxed">{item.notes}</td>
          </>
        );
      case 'Land Values':
        return (
          <>
            <td className="px-6 py-5 font-bold text-primary text-xs">{item.area && item.city ? `${item.area}, ${item.city}` : item.title || '-'}</td>
            <td className="px-6 py-5 text-slate-500 text-xs font-medium">{item.region || '-'}</td>
            <td className="px-6 py-5 text-center"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${getSubCatColor(item.zoning)}`}>{item.zoning || '-'}</span></td>
            <td className="px-6 py-5 text-center text-slate-500 text-[10px] font-bold">{item.landSize || item.plotSize || '-'}</td>
            <td className="px-6 py-5 text-center font-black text-[#d4a017] text-xs">GHS {item.price ? Number(item.price).toLocaleString() : (item.minPrice ? `${item.minPrice.toLocaleString()} - ${item.maxPrice.toLocaleString()}` : '-')}</td>
            <td className="px-6 py-5 max-w-xs text-[10px] text-slate-400 italic leading-relaxed">
              {item.tenure ? <span className="font-bold text-slate-500 block mb-1">Tenure: {item.tenure}</span> : ''}
              {item.notes}
            </td>
          </>
        );
      case 'Rental Evidence':
        return (
          <>
            <td className="px-6 py-5 font-bold text-primary text-xs">{item.propertyType || item.title || '-'}</td>
            <td className="px-6 py-5 text-slate-500 text-xs font-medium">{item.area && item.city ? `${item.area}, ${item.city}` : item.location || '-'}</td>
            <td className="px-6 py-5 text-slate-400 text-xs font-medium">{item.region || '-'}</td>
            <td className="px-6 py-5 text-center font-black text-[#d4a017] text-xs">GHS {item.rent ? Number(item.rent).toLocaleString() : (item.minPrice ? `${item.minPrice.toLocaleString()} - ${item.maxPrice.toLocaleString()}` : '-')}</td>
            <td className="px-6 py-5 text-center text-slate-500 text-[9px]">
              <span className="px-3 py-1 rounded-lg font-black uppercase bg-teal-50 text-teal-600 tracking-widest block w-max mx-auto mb-1">{item.rentBasis || item.basis || '-'}</span>
              {item.occupancy ? <span className="font-bold mt-1 block">Occ: {item.occupancy}%</span> : ''}
            </td>
            <td className="px-6 py-5 max-w-xs text-[10px] text-slate-400 italic leading-relaxed">{item.notes}</td>
          </>
        );
      default:
        return (
          <>
            <td className="px-6 py-5 font-bold text-primary text-xs">{item.title}</td>
            <td className="px-6 py-5 text-center font-black text-accent text-xs">{item.value} {item.unit}</td>
            <td className="px-6 py-5 text-center text-slate-400 text-xs font-bold">{item.period}</td>
            <td className="px-6 py-5 text-[10px] text-slate-400 italic">{item.notes}</td>
          </>
        );
    }
  };


  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>{renderHeaders()}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50/20 transition group">
                {renderCells(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest opacity-50">No records available for this section.</p>
        </div>
      )}
    </div>
  );
};

const staticCategories = {
  'Market Overview': {
    title: 'Market Intelligence Overview',
    subtitle: 'National Snapshot • March 2025',
    info: 'This overview provides a high-level summary of professional property market trends across Ghana. Data is aggregated from quarterly valuation reports, official land registry transfers, and verified agency transactions.',
    icon: 'BarChart3'
  },
  'Sale Transactions': {
    title: 'Sale Evidence Database',
    subtitle: 'Confirmed Transfers • Greater Accra & Ashanti',
    info: 'Granular evidence of confirmed property sales. Use this data for direct comparison in market-based valuations. All entries include verified sale dates and verified indices.',
    icon: 'FileText'
  },
  'Rental Evidence': {
    title: 'Rental Intelligence',
    subtitle: 'Lease Transcripts • Yield Analysis',
    info: 'Current rental rates across residential, office, and commercial sectors. Vital for income-capitalization and DCF valuation methods.',
    icon: 'Home'
  },
  'Construction Costs': {
    title: 'Replacement Cost Database',
    subtitle: 'GHS per Square Metre • Building Types',
    info: 'Standardized construction rates by building specification. Essential for the Cost Approach (Depreciated Replacement Cost). Rates include labor, materials, and professional fees.',
    icon: 'HardHat'
  },
  'Building Materials': {
    title: 'Material Price Tracker',
    subtitle: 'Supplier Quotes • Weekly Updates',
    info: 'Real-time pricing for core construction inputs (Cement, Rebar, Sand). Helps in adjusting construction cost models for inflation.',
    icon: 'Box'
  },
  'Cap Rates / Yields': {
    title: 'Investment Parameters',
    subtitle: 'Risk Premium • Capitalization Rates',
    info: 'Benchmark capitalization rates derived from market analysis. Used to convert annual income into capital value for stable investment properties.',
    icon: 'Percent'
  },
  'Land Values': {
    title: 'Land Value Mapping',
    subtitle: 'Zoning • Tenure • Plot Prices',
    info: 'Unimproved land values per plot or acre. Differentiated by zoning (Residential vs Commercial) and tenure (Freehold vs Leasehold duration).',
    icon: 'Map'
  }
};

const DataBank = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'Market Overview';

  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [marketData, setMarketData] = useState([]);
  const [categoryMetadata, setCategoryMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: 'All Categories',
    spec: 'All Specifications'
  });



  useEffect(() => {
    if (categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam, activeCategory]);

  const [uploadStep, setUploadStep] = useState(1);
  const [selectedUploadType, setSelectedUploadType] = useState(null);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [bulkSuccessSummary, setBulkSuccessSummary] = useState(null);

  const currentDate = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleCategoryChange = (catId) => {
    setSearchParams({ category: catId });
    // Reset upload step if changing category
    setUploadStep(1);
    setSelectedUploadType(null);
    setEditingSubmission(null);
  };

  // Auto-Sync globally on mount for Admins
  useEffect(() => {
    if (user?.role === 'Admin') {
      api.post('/market-data/google-sheets/auto-sync')
        .then(() => fetchCategoryData()) // Re-fetch immediately after background sync
        .catch(() => {}); // Silent fail on auto-sync
    }
    // eslint-disable-next-line
  }, [user]);

  const handleUploadSelect = (dataId) => {
    setSelectedUploadType(dataId);
    setEditingSubmission(null);
    setUploadStep(2);
  };

  const handleEditSubmission = (submission) => {
    setSelectedUploadType(submission.category);
    setEditingSubmission(submission);
    setUploadStep(2);
  };

  const handleUploadSubmit = async (formDataOrArray, isBulk = false, sourceId = null, sourceName = null) => {
    try {
      if (editingSubmission) {
        // Resubmit flow
        await api.put(`/market-data/${editingSubmission._id}/resubmit`, formDataOrArray);
      } else if (isBulk) {
        const res = await api.post('/market-data/bulk', {
          category: selectedUploadType,
          entries: formDataOrArray,
          sourceSpreadsheetId: sourceId,
          sourceSheetName: sourceName
        });
        setBulkSuccessSummary(res.data.msg);
      } else {
        await api.post('/market-data', {
          ...formDataOrArray,
          category: selectedUploadType
        });
      }
      
      // Reset after successful upload
      setUploadStep(1);
      setSelectedUploadType(null);
      setEditingSubmission(null);
      // Re-fetch to show new data
      fetchCategoryData();
    } catch (err) {
      console.error('Error submitting data:', err);
    }
  };

  const fetchCategoryData = useCallback(async () => {
    if (activeCategory === 'Upload Data') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch data entries
      let res;
      if (activeCategory === 'Market Overview') {
        res = await api.get('/market-data/summary');
        // Combine indicators and cityGrowth into one array for the existing filter logic
        setMarketData([...res.data.indicators, ...res.data.cityGrowth]);
      } else {
        res = await api.get('/market-data', {
          params: {
            category: activeCategory,
            search: filters.search
          }
        });
        setMarketData(res.data);
      }

      // Use hardcoded metadata for headers
      setCategoryMetadata(staticCategories[activeCategory] || staticCategories['Market Overview']);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, filters.search]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  const IconComponent = categoryMetadata?.icon ? (iconMap[categoryMetadata.icon] || BarChart3) : BarChart3;

  // Overview Data Splits
  const overviewSnapshots = marketData.filter(item => item.subCategory === 'indicator');
  const cityGrowthStats = marketData.filter(item => item.subCategory === 'city_growth');

  const getFilterOptions = (category) => {
    switch (category) {
      case 'Construction Costs': return ['All Types', 'Residential', 'Commercial', 'Office', 'Warehouse'];
      case 'Building Materials': return ['All Types', 'General Construction', 'Finishing', 'Electrical', 'Plumbing', 'Roofing', 'Masonry'];
      case 'Land Values': return ['All Types', 'Plot', 'Agricultural', 'Brownfield'];
      default: return ['All Types', 'Residential', 'Commercial', 'Office', 'Retail', 'Industrial', 'Mixed-Use'];
    }
  };

  const filteredData = marketData.filter(item => {
    // Search Filter
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const match = [
        item.title, item.propertyType, item.location, item.region, item.city, item.area, item.materialName, item.zoning
      ].some(val => val && val.toString().toLowerCase().includes(term));
      if (!match) return false;
    }
    // Property Type Filter
    if (filters.spec && filters.spec !== 'All Types' && filters.spec !== 'All Specifications') {
      const typeStr = filters.spec.toLowerCase();
      const itemType = [item.propertyType, item.title, item.zoning, item.subCategory, item.materialName].join(' ').toLowerCase();
      if (!itemType.includes(typeStr)) return false;
    }
    return true;
  });

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden h-screen font-inter uppercase-none">
        <div className="h-full overflow-y-auto p-4 md:p-10 pb-20 scrollbar-hide bg-[#f8fafc]">
          <header className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center space-x-4">
              <Menu size={20} className="text-slate-400 cursor-pointer lg:hidden" />
              <div className="flex items-center space-x-3">
                <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                <h2 className="text-sm font-black text-primary tracking-widest">{activeCategory.toUpperCase()}</h2>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest">{currentDate}</span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-widest">Ghana • GHS</span>
              </div>
              <button
                onClick={() => handleCategoryChange('Upload Data')}
                className="bg-[#d4a017] text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center shadow-lg shadow-yellow-800/20"
              >
                <Upload size={14} className="mr-2" /> Upload Data
              </button>
            </div>
          </header>

          {bulkSuccessSummary && (
            <div className="mb-6 mx-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex justify-between items-center animate-in fade-in slide-in-from-top-2">
              <span>{bulkSuccessSummary}</span>
              <button onClick={() => setBulkSuccessSummary(null)} className="p-1 hover:bg-emerald-100 rounded-full transition">
                <X size={14} />
              </button>
            </div>
          )}

          {activeCategory === 'Upload Data' ? (
            uploadStep === 1 ? (
              <UploadDashboard onSelect={handleUploadSelect} onEditSubmission={handleEditSubmission} />
            ) : (
              <ContributionForm
                type={selectedUploadType}
                editingData={editingSubmission}
                onBack={() => { setUploadStep(1); setEditingSubmission(null); }}
                onSubmit={(data) => handleUploadSubmit(data, false)}
                onSubmitBulk={(data, sid, sname) => handleUploadSubmit(data, true, sid, sname)}
                setBulkSuccessSummary={setBulkSuccessSummary}
              />
            )
          ) : activeCategory !== 'Market Overview' && categoryMetadata ? (
            <div className="mb-8 px-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                    <IconComponent size={18} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-primary tracking-tight">{categoryMetadata.title}</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{categoryMetadata.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                    {user?.role === 'Admin' && (
                      <button
                        onClick={async () => {
                          const sourceData = marketData.find(d => d.sourceSpreadsheetId && d.sourceSheetName);
                          if (!sourceData) {
                            alert('No records in this view were found with a linked Google Sheet source.');
                            return;
                          }
                          setLoading(true);
                          try {
                            const res = await api.post('/market-data/google-sheets/sync', {
                              spreadsheetId: sourceData.sourceSpreadsheetId,
                              sheetName: sourceData.sourceSheetName,
                              category: activeCategory
                            });
                            setBulkSuccessSummary(res.data.msg);
                            fetchCategoryData();
                          } catch (err) {
                            alert(err.response?.data?.msg || 'Sync failed.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center hover:bg-blue-100 transition-all"
                      >
                        <RefreshCw size={12} className="mr-2" /> Sync from Google
                      </button>
                    )}
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Updated: {currentDate}</span>
                  </div>
              </div>

              <div className="mt-8 bg-blue-50/50 border border-blue-100 p-6 rounded-[1.5rem] flex gap-4">
                <div className="w-6 h-6 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
                  <Info size={14} className="text-white" />
                </div>
                <p className="text-[10px] text-blue-800/80 font-medium leading-relaxed italic opacity-80">
                  {categoryMetadata.info}
                </p>
              </div>

              <div className="mt-10 mb-8 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent" />
                  <input
                    type="text"
                    placeholder="Search current database..."
                    className="w-full bg-white border border-slate-100 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:ring-1 focus:ring-accent font-medium text-xs shadow-sm transition-all"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative min-w-[160px]">
                    <select
                      className="w-full appearance-none bg-white border border-slate-100 py-3.5 pl-5 pr-12 rounded-xl outline-none focus:ring-1 focus:ring-accent font-black text-[9px] uppercase tracking-widest shadow-sm cursor-pointer"
                      value={filters.spec}
                      onChange={(e) => setFilters({ ...filters, spec: e.target.value })}
                    >
                      {getFilterOptions(activeCategory).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <UnifiedDataTable category={activeCategory} data={filteredData} loading={loading} />
            </div>
          ) : (
            <>
              {activeCategory === 'Market Overview' && (
                <section className="bg-[#0f172a] rounded-[2rem] p-8 md:p-14 mb-10 text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 max-w-2xl">
                    <p className="text-slate-400 font-bold tracking-[0.4em] text-[8px] uppercase mb-8 opacity-60">GHANA PROPERTY VALUATION DATA BANK • 2025</p>
                    <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight tracking-tight">
                      The Data Valuers <span className="text-[#facc15]">Need</span>.<br />
                      All in One Place.
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm mb-12 leading-relaxed opacity-80 max-w-lg">
                      Real Ghana market data: construction costs, building materials, cap rates, land
                      values, rental evidence, and market intelligence — sourced, verified, and updated
                      quarterly. Use this data to complete your valuations.
                    </p>

                    <div className="flex flex-wrap gap-2.5">
                      {['Construction Costs', 'Building Materials', 'Cap Rates', 'Land Values', 'Rental Data'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleCategoryChange(tag)}
                          className="px-5 py-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-200 uppercase tracking-widest hover:bg-[#facc15] hover:text-slate-900 transition-all duration-300 flex items-center"
                        >
                          <TrendingUp size={12} className="mr-2 text-[#facc15] group-hover:text-inherit" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <div className="mb-14 px-2">
                <div className="flex items-center space-x-3 mb-6 px-1">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">MARKET SNAPSHOT • MARCH 2025</h3>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-[#facc15] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-10">
                      {overviewSnapshots.length > 0 ? overviewSnapshots.map((data) => (
                        <SnapshotCard
                          key={data._id}
                          title={data.title}
                          value={data.value}
                          unit={data.unit}
                          change={data.change}
                          changeText={data.changeText}
                          trend={data.trend}
                          iconName={data.icon}
                        />
                      )) : (
                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold text-xs">No snapshot records found for this category.</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-slate-100">
                      <h3 className="text-xs font-black text-primary mb-8 tracking-wide">Property Price Growth by City</h3>
                      <div className="space-y-6">
                        {cityGrowthStats.length > 0 ? cityGrowthStats.map((city, idx) => (
                          <div key={city._id} className="group">
                            <div className="flex justify-between items-end mb-2.5">
                              <span className="text-xs font-bold text-slate-700">{city.title}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black text-slate-800 tracking-wider">
                                  {city.value}% <span className="text-slate-400 font-semibold">{city.changeText}</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded shadow-sm text-[8px] font-black uppercase tracking-widest ${
                                  city.trend === 'up' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                  city.trend === 'down' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                                  'bg-[#fdf8e8] text-[#d4a017] border border-[#fcefb5]'
                                }`}>
                                  {city.change}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden flex border border-slate-100">
                              <div 
                                className={`h-full rounded-r-none transition-all duration-1000 ease-out ${idx % 2 === 0 ? 'bg-gradient-to-r from-[#eab308] to-[#ca8a04]' : 'bg-gradient-to-r from-slate-600 to-slate-800'}`}
                                style={{ width: `${Math.min(Number(city.value) * 6, 100)}%` }}
                              />
                            </div>
                          </div>
                        )) : (
                          <p className="text-slate-400 font-bold text-xs text-center">No city growth data found.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Contribution Modal (simplified) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-primary tracking-tight">Upload Market Data</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg transition"><X size={20} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
              Please use our standard templates for {activeCategory} submissions. This ensures consistency across the Data Bank.
            </p>
            <button className="w-full py-4 bg-[#d4a017] text-white font-black rounded-xl shadow-xl shadow-yellow-800/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-[9px]">Download Template & Submit</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataBank;
