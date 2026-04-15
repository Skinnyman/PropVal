import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Plus,
  ChevronRight,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  Calculator,
  Home,
  Loader2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ValuationWorkspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.selectedMethod) {
      setMethod(location.state.selectedMethod);
      setStep(2);
    }
    
    const fetchPreFillProperty = async () => {
      if (location.state?.propertyId) {
        try {
          const res = await api.get(`/properties/${location.state.propertyId}`);
          const p = res.data;
          setSubject({
            region: p.location?.region || 'Greater Accra',
            district: p.location?.district || '',
            suburb: p.location?.suburb || '',
            propertyType: p.propertyInfo?.propertyType || 'Residential',
            size: p.propertyInfo?.size || '',
            landSize: p.propertyInfo?.landSize || '',
            rooms: p.propertyInfo?.rooms || '',
            yearBuilt: p.propertyInfo?.yearBuilt || new Date().getFullYear(),
            condition: p.propertyInfo?.condition || 'Good',
            images: p.propertyInfo?.images || []
          });
          
          if (p.marketData) {
            setIncomeData(prev => ({
              ...prev,
              annualRentalIncome: p.marketData.rentalValue || '',
              capRate: p.marketData.capRate || ''
            }));
            setCostData(prev => ({
              ...prev,
              constructionCostPerSqm: p.marketData.constructionCostPerSqm || ''
            }));
          }
          
          setStep(2); // Jump to subject details
        } catch (err) {
          console.error('Error pre-filling property:', err);
        }
      }
    };
    
    fetchPreFillProperty();
  }, [location.state]);
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('Comparable Sales');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedComps, setSelectedComps] = useState([]);
  const [compAdjustments, setCompAdjustments] = useState({});
  const [valuationResult, setValuationResult] = useState(null);

  const [subject, setSubject] = useState({
    region: 'Greater Accra',
    district: '',
    suburb: '',
    propertyType: 'Residential',
    size: '',
    landSize: '',
    rooms: '',
    yearBuilt: new Date().getFullYear(),
    condition: 'Good',
    images: []
  });

  const [incomeData, setIncomeData] = useState({
    methodology: 'Direct Capitalization',
    annualRentalIncome: '',
    vacancyRate: '',
    operatingExpenses: '',
    capRate: '',
    dcfProjections: [{ year: 1, grossIncome: '', expenses: '', netOperatingIncome: '', discountRate: '' }],
    terminalValue: ''
  });

  const [costData, setCostData] = useState({
    landValue: '',
    directCosts: '',
    indirectCosts: '',
    depreciation: { physical: '', functional: '', external: '', effectiveAge: '', economicLife: 50 },
    constructionCostPerSqm: '', // Legacy support
  });

  const [residualData, setResidualData] = useState({
    gdv: '',
    constructionCosts: '',
    professionalFees: '',
    financeRate: '',
    financeDurationMonths: '',
    developerProfitMargin: ''
  });

  const [profitData, setProfitData] = useState({
    grossAnnualRevenue: '',
    purchases: '',
    operatingExpenses: '',
    tenantCapital: '',
    tenantReturnRate: '',
    operatorRemuneration: '',
    capitalizationYield: ''
  });

  const onSubjectChange = (e) => {
    setSubject({ ...subject, [e.target.name]: e.target.value });
  };

  const onIncomeChange = (e) => setIncomeData({ ...incomeData, [e.target.name]: e.target.value });
  const onCostChange = (e) => setCostData({ ...costData, [e.target.name]: e.target.value });
  const onCostDepreciationChange = (e) => setCostData({ ...costData, depreciation: { ...costData.depreciation, [e.target.name]: e.target.value } });
  const onResidualChange = (e) => setResidualData({ ...residualData, [e.target.name]: e.target.value });
  const onProfitChange = (e) => setProfitData({ ...profitData, [e.target.name]: e.target.value });

  const addDcfYear = () => {
    setIncomeData({
      ...incomeData,
      dcfProjections: [
        ...incomeData.dcfProjections, 
        { year: incomeData.dcfProjections.length + 1, grossIncome: '', expenses: '', netOperatingIncome: '', discountRate: 10 }
      ]
    });
  };

  const onDcfChange = (index, field, value) => {
    const projs = [...incomeData.dcfProjections];
    projs[index][field] = value;
    setIncomeData({ ...incomeData, dcfProjections: projs });
  };

  const fetchComparables = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/properties?region=${subject.region}&propertyType=${subject.propertyType}`);
      setProperties(res.data);
      setStep(3);
    } catch (err) {
      console.error('Error fetching comparables:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComp = (id) => {
    let newSelected = [...selectedComps];
    if (newSelected.includes(id)) {
      newSelected = newSelected.filter(compId => compId !== id);
    } else {
      newSelected.push(id);
    }
    
    // Sync adjustments object
    const newAdj = { ...compAdjustments };
    newSelected.forEach(cid => {
      if (!newAdj[cid]) newAdj[cid] = { transactionAdjustments: [], propertyAdjustments: [] };
    });
    setCompAdjustments(newAdj);
    setSelectedComps(newSelected);
  };

  const addCompAdjustment = (compId, type) => {
    const newAdj = { ...compAdjustments };
    newAdj[compId][type].push({ reason: '', percentage: '', amount: '' });
    setCompAdjustments(newAdj);
  };

  const updateCompAdjustment = (compId, type, index, field, value) => {
    const newAdj = { ...compAdjustments };
    newAdj[compId][type][index][field] = value;
    setCompAdjustments(newAdj);
  };

  const finalizeValuation = async () => {
    setLoading(true);
    try {
      let endpoint = '/valuations/comparable';
      let payload = { subjectProperty: subject };

      if (method === 'Income Capitalization') {
        endpoint = '/valuations/income';
        payload.incomeData = {
          methodology: incomeData.methodology,
          annualRentalIncome: Number(incomeData.annualRentalIncome),
          vacancyRate: Number(incomeData.vacancyRate),
          operatingExpenses: Number(incomeData.operatingExpenses),
          capRate: Number(incomeData.capRate),
          terminalValue: Number(incomeData.terminalValue),
          dcfProjections: incomeData.dcfProjections
        };
      } else if (method === 'Cost Method') {
        endpoint = '/valuations/cost';
        payload.costData = {
          landValue: Number(costData.landValue),
          directCosts: Number(costData.directCosts),
          indirectCosts: Number(costData.indirectCosts),
          depreciation: {
            physical: Number(costData.depreciation.physical),
            functional: Number(costData.depreciation.functional),
            external: Number(costData.depreciation.external),
            effectiveAge: Number(costData.depreciation.effectiveAge),
            economicLife: Number(costData.depreciation.economicLife)
          }
        };
      } else if (method === 'Residual Method') {
        endpoint = '/valuations/residual';
        payload.residualData = {
          gdv: Number(residualData.gdv),
          constructionCosts: Number(residualData.constructionCosts),
          professionalFees: Number(residualData.professionalFees),
          financeRate: Number(residualData.financeRate),
          financeDurationMonths: Number(residualData.financeDurationMonths),
          developerProfitMargin: Number(residualData.developerProfitMargin)
        };
      } else if (method === 'Profit Method') {
        endpoint = '/valuations/profit';
        payload.profitData = {
          grossAnnualRevenue: Number(profitData.grossAnnualRevenue),
          purchases: Number(profitData.purchases),
          operatingExpenses: Number(profitData.operatingExpenses),
          tenantCapital: Number(profitData.tenantCapital),
          tenantReturnRate: Number(profitData.tenantReturnRate),
          operatorRemuneration: Number(profitData.operatorRemuneration),
          capitalizationYield: Number(profitData.capitalizationYield)
        };
      } else {
        payload.selectedComparables = selectedComps;
        payload.adjustments = selectedComps.map(id => {
          const adj = compAdjustments[id];
          return {
            propertyId: id,
            transactionAdjustments: adj.transactionAdjustments.map(a => ({
              reason: a.reason,
              percentage: Number(a.percentage || 0),
              amount: Number(a.amount || 0)
            })).filter(a => a.percentage !== 0 || a.amount !== 0),
            propertyAdjustments: adj.propertyAdjustments.map(a => ({
              reason: a.reason,
              percentage: Number(a.percentage || 0),
              amount: Number(a.amount || 0)
            })).filter(a => a.percentage !== 0 || a.amount !== 0)
          }
        });
      }

      const res = await api.post(endpoint, payload);
      setValuationResult(res.data);
      setStep(4);
    } catch (err) {
      console.error('Error finalizing valuation:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFinalize = () => {
    navigate('/reports');
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 sticky top-0 z-40">
          <h1 className="text-xl md:text-2xl font-bold text-primary">Valuation Workspace</h1>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto relative">
              {/* Progress Stepper */}
              <div className="flex items-center justify-between mb-8 md:mb-12 px-2 md:px-4 overflow-x-auto pb-4 hide-scrollbar">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition duration-300 ${step >= s ? 'bg-accent text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                    {loading && step === s ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : s}
                  </div>
                  <span className={`text-[10px] mt-2 font-medium ${step >= s ? 'text-accent' : 'text-slate-400'} whitespace-nowrap`}>
                    {s === 1 ? 'Method' : s === 2 ? 'Subject' : s === 3 ? 'Comps' : s === 4 ? 'Calc' : 'Final'}
                  </span>
                </div>
                {s < 5 && <div className={`flex-1 h-0.5 mx-2 md:mx-4 ${step > s ? 'bg-accent' : 'bg-slate-200'}`}></div>}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            {step === 1 && (
              <div className="p-6 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 text-center">Choose Valuation Method</h2>
                <p className="text-slate-500 text-center mb-8 md:mb-12">Select the most appropriate methodology for your subject property.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div
                    onClick={() => setMethod('Comparable Sales')}
                    className={`p-8 rounded-3xl border-2 cursor-pointer transition flex flex-col items-center group ${method === 'Comparable Sales' ? 'border-accent bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition">
                      <Plus size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Comparable Sales</h3>
                    <p className="text-center text-slate-500 text-sm">Ideal for residential properties and lands with high market activity.</p>
                  </div>

                  <div
                    onClick={() => setMethod('Income Capitalization')}
                    className={`p-8 rounded-3xl border-2 cursor-pointer transition flex flex-col items-center group ${method === 'Income Capitalization' ? 'border-accent bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition">
                      <DollarSign size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Income Capitalization</h3>
                    <p className="text-center text-slate-500 text-sm">Used for commercial and rental properties based on expected yields.</p>
                  </div>

                  <div
                    onClick={() => setMethod('Cost Method')}
                    className={`p-8 rounded-3xl border-2 cursor-pointer transition flex flex-col items-center group ${method === 'Cost Method' ? 'border-accent bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition">
                      <Home size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Cost Method</h3>
                    <p className="text-center text-slate-500 text-sm">Based on the 'Replacement Cost' approach for specialized buildings.</p>
                  </div>

                  <div
                    onClick={() => setMethod('Residual Method')}
                    className={`p-8 rounded-3xl border-2 cursor-pointer transition flex flex-col items-center group ${method === 'Residual Method' ? 'border-accent bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition">
                      <Calculator size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Residual Method</h3>
                    <p className="text-center text-slate-500 text-sm">Used to estimate land value for potential redevelopment projects.</p>
                  </div>

                  <div
                    onClick={() => setMethod('Profit Method')}
                    className={`p-8 rounded-3xl border-2 cursor-pointer transition flex flex-col items-center group ${method === 'Profit Method' ? 'border-accent bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Profit Method</h3>
                    <p className="text-center text-slate-500 text-sm">Applied to businesses where profit is the primary value driver.</p>
                  </div>
                </div>

                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-accent text-white px-10 py-4 rounded-2xl font-bold flex items-center shadow-lg shadow-blue-200 hover:scale-105 transition"
                  >
                    Continue to Subject Property <ArrowRight size={20} className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-6 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Subject Property Details</h2>
                <p className="text-slate-500 mb-8 md:mb-10">Define the core characteristics of the property being valued.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                    <select
                      name="region" value={subject.region} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                    >
                      <option>Greater Accra</option>
                      <option>Ashanti Region</option>
                      <option>Western Region</option>
                      <option>Central Region</option>
                      <option>Eastern Region</option>
                      <option>Northern Region</option>
                      <option>Volta Region</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                    <input
                      name="district" value={subject.district} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition"
                      placeholder="Accra Metropolitan"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Suburb</label>
                    <input
                      name="suburb" value={subject.suburb} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition"
                      placeholder="e.g. East Legon"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Property Type</label>
                    <select
                      name="propertyType" value={subject.propertyType} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                    >
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Land</option>
                      <option>Office</option>
                      <option>Mixed-use</option>
                      <option>Industrial</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Building Size (sqm)</label>
                    <input
                      name="size" value={subject.size} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition"
                      placeholder="350"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Land Size (sqm/acres)</label>
                    <input
                      name="landSize" value={subject.landSize} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition"
                      placeholder="0.5"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Rooms/Units</label>
                    <input
                      name="rooms" value={subject.rooms} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition"
                      placeholder="4"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Year Built</label>
                    <input
                      name="yearBuilt" value={subject.yearBuilt} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition"
                      placeholder="2022"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Condition</label>
                    <select
                      name="condition" value={subject.condition} onChange={onSubjectChange}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                    >
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Fair</option>
                      <option>Poor</option>
                      <option>Under Construction</option>
                    </select>
                  </div>
                </div>

                {method === 'Income Capitalization' && (
                  <div className="mt-10 pt-10 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-primary flex items-center">
                        <DollarSign className="text-accent mr-2" size={20} />
                        Income Data
                      </h3>
                      <select name="methodology" value={incomeData.methodology} onChange={onIncomeChange} className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-accent">
                        <option>Direct Capitalization</option>
                        <option>DCF</option>
                      </select>
                    </div>

                    {incomeData.methodology === 'Direct Capitalization' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Annual Rent (GHS)</label>
                          <input type="number" name="annualRentalIncome" value={incomeData.annualRentalIncome} onChange={onIncomeChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Vacancy Rate (%)</label>
                          <input type="number" name="vacancyRate" value={incomeData.vacancyRate} onChange={onIncomeChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expenses (GHS)</label>
                          <input type="number" name="operatingExpenses" value={incomeData.operatingExpenses} onChange={onIncomeChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cap Rate (%)</label>
                          <input type="number" name="capRate" value={incomeData.capRate} onChange={onIncomeChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-6 flex justify-between items-center bg-slate-50 border-none rounded-3xl">
                          <div className="space-y-2">
                             <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Value (Reversion) GHS</label>
                             <input type="number" name="terminalValue" value={incomeData.terminalValue} onChange={onIncomeChange} className="w-[300px] bg-white border border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold text-primary" placeholder="Exit Value" />
                          </div>
                          <button onClick={addDcfYear} className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-primary hover:border-accent hover:text-accent transition flex items-center">
                             <Plus size={16} className="mr-2" /> Add Year Projection
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">NOI Projection (GHS)</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount Target Rate (%)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {incomeData.dcfProjections.map((proj, idx) => (
                                <tr key={idx} className="bg-slate-50 rounded-2xl">
                                  <td className="px-4 py-4 font-black text-slate-400 bg-white border border-slate-50 rounded-l-2xl text-center">{proj.year}</td>
                                  <td className="px-4 py-2 bg-white border border-slate-50">
                                    <input type="number" value={proj.netOperatingIncome} onChange={(e) => onDcfChange(idx, 'netOperatingIncome', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-accent font-bold" placeholder="Net Operating Income" />
                                  </td>
                                  <td className="px-4 py-2 bg-white border border-slate-50 rounded-r-2xl">
                                    <input type="number" value={proj.discountRate} onChange={(e) => onDcfChange(idx, 'discountRate', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-accent font-bold text-center" placeholder="10" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {method === 'Cost Method' && (
                  <div className="mt-10 pt-10 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-primary mb-6 flex items-center">
                      <Home className="text-amber-500 mr-2" size={20} />
                      Cost Method Inputs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Land Value (GHS)</label>
                        <input type="number" name="landValue" value={costData.landValue} onChange={onCostChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Direct Costs (Const)</label>
                        <input type="number" name="directCosts" value={costData.directCosts} onChange={onCostChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Indirect Costs</label>
                        <input type="number" name="indirectCosts" value={costData.indirectCosts} onChange={onCostChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Effective Age (Yrs)</label>
                        <input type="number" name="effectiveAge" value={costData.depreciation.effectiveAge} onChange={onCostDepreciationChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-500 transition font-bold" placeholder="e.g. 5" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Economic Life (Yrs)</label>
                        <input type="number" name="economicLife" value={costData.depreciation.economicLife} onChange={onCostDepreciationChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-500 transition font-bold" placeholder="e.g. 50" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Functional Obs. (GHS)</label>
                        <input type="number" name="functional" value={costData.depreciation.functional} onChange={onCostDepreciationChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-500 transition font-bold text-red-500" placeholder="0" />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'Residual Method' && (
                  <div className="mt-10 pt-10 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-primary mb-6 flex items-center">
                      <Calculator className="text-purple-500 mr-2" size={20} />
                      Residual Method Inputs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Gross Dev Value (GDV)</label>
                        <input type="number" name="gdv" value={residualData.gdv} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Construction Costs</label>
                        <input type="number" name="constructionCosts" value={residualData.constructionCosts} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Professional Fees</label>
                        <input type="number" name="professionalFees" value={residualData.professionalFees} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Finance Rate %</label>
                        <input type="number" name="financeRate" value={residualData.financeRate} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition font-bold" placeholder="e.g. 15" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Proj. Duration (Months)</label>
                        <input type="number" name="financeDurationMonths" value={residualData.financeDurationMonths} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition font-bold" placeholder="e.g. 24" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Target Profit Margin % (GDV)</label>
                        <input type="number" name="developerProfitMargin" value={residualData.developerProfitMargin} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 transition font-bold" placeholder="e.g. 20" />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'Profit Method' && (
                  <div className="mt-10 pt-10 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-primary mb-6 flex items-center">
                      <ShieldCheck className="text-rose-500 mr-2" size={20} />
                      Profit Method Inputs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gross Annual Revenue</label>
                        <input type="number" name="grossAnnualRevenue" value={profitData.grossAnnualRevenue} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Purchases/Cost of Goods</label>
                        <input type="number" name="purchases" value={profitData.purchases} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Operating Expenses</label>
                        <input type="number" name="operatingExpenses" value={profitData.operatingExpenses} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tenant Capital</label>
                        <input type="number" name="tenantCapital" value={profitData.tenantCapital} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 transition font-bold" placeholder="Inventory, Fixtures etc." />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tenant Return Rate (%)</label>
                        <input type="number" name="tenantReturnRate" value={profitData.tenantReturnRate} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 transition font-bold" placeholder="e.g. 5" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Operator Remuneration</label>
                        <input type="number" name="operatorRemuneration" value={profitData.operatorRemuneration} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 transition font-bold text-rose-500" placeholder="Manager Salary Deduction" />
                      </div>
                      <div className="space-y-3 lg:col-span-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cap Yield (%)</label>
                        <input type="number" name="capitalizationYield" value={profitData.capitalizationYield} onChange={onProfitChange} className="w-full bg-slate-100 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 transition font-black text-primary text-center" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse md:flex-row justify-between items-center bg-slate-50 -mx-6 md:-mx-12 -mb-6 md:-mb-12 p-6 md:p-8 border-t border-slate-100 mt-8 md:mt-12 gap-4">
                  <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-primary transition w-full md:w-auto py-3">Back</button>
                  {method === 'Comparable Sales' ? (
                    <button
                      onClick={fetchComparables}
                      disabled={loading || !subject.suburb}
                      className="bg-accent text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center w-full md:w-auto shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                      {loading ? 'Searching...' : 'Find Comparables'} {!loading && <ChevronRight size={20} className="ml-1" />}
                    </button>
                  ) : (
                    <button
                      onClick={finalizeValuation}
                      disabled={loading || !subject.size || (method === 'Income Capitalization' && !incomeData.annualRentalIncome)}
                      className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center w-full md:w-auto shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                      {loading ? 'Calculating...' : 'Calculate Valuation'} {!loading && <ChevronRight size={20} className="ml-1" />}
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-6 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Select Comparables</h2>
                <p className="text-slate-500 mb-8 md:mb-10">Select at least 3 recent transactions to base your valuation on.</p>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 mb-10">
                  {properties.length > 0 ? (
                    properties.map((comp) => (
                      <div key={comp._id} className="border-2 rounded-3xl transition border-slate-100 overflow-hidden shadow-sm">
                        <div
                          onClick={() => toggleComp(comp._id)}
                          className={`flex items-center justify-between p-6 cursor-pointer group ${selectedComps.includes(comp._id) ? 'bg-blue-50/30' : 'bg-slate-50 hover:bg-white'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${selectedComps.includes(comp._id) ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-accent/10 group-hover:text-accent'}`}>
                              <Plus size={20} />
                            </div>
                            <div>
                              <h5 className="font-bold text-primary">{comp.location?.suburb}, {comp.location?.region}</h5>
                              <p className="text-xs text-slate-500">{comp.propertyInfo?.propertyType} • {comp.propertyInfo?.size} sqm • {comp.propertyInfo?.rooms} Rooms</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-primary text-sm md:text-base">GHS {comp.marketData?.salePrice?.toLocaleString()}</p>
                            <span className="text-[8px] md:text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md font-bold uppercase mt-1 inline-block">Verified</span>
                          </div>
                        </div>

                        {selectedComps.includes(comp._id) && compAdjustments[comp._id] && (
                          <div className="p-6 bg-white border-t border-slate-100">
                             <h6 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Set Adjustments</h6>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               {/* Transaction Adjustments */}
                               <div>
                                 <div className="flex justify-between items-center mb-3">
                                   <span className="text-xs font-bold text-primary">1. Transaction Adjustments</span>
                                   <button onClick={() => addCompAdjustment(comp._id, 'transactionAdjustments')} className="text-xs font-bold text-accent bg-blue-50 px-2 py-1 rounded-lg">+ Add</button>
                                 </div>
                                 <div className="space-y-2">
                                   {compAdjustments[comp._id].transactionAdjustments.map((adj, i) => (
                                     <div key={`tx-${i}`} className="flex space-x-2">
                                       <input placeholder="Reason (e.g. Time)" value={adj.reason} onChange={e => updateCompAdjustment(comp._id, 'transactionAdjustments', i, 'reason', e.target.value)} className="w-1/2 p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                       <input type="number" placeholder="% (e.g. +5)" value={adj.percentage} onChange={e => updateCompAdjustment(comp._id, 'transactionAdjustments', i, 'percentage', e.target.value)} className="w-1/4 p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                       <input type="number" placeholder="Amt" value={adj.amount} onChange={e => updateCompAdjustment(comp._id, 'transactionAdjustments', i, 'amount', e.target.value)} className="w-1/4 p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                     </div>
                                   ))}
                                   {compAdjustments[comp._id].transactionAdjustments.length === 0 && <span className="text-xs text-slate-400">No transaction adjustments applied.</span>}
                                 </div>
                               </div>

                               {/* Property Adjustments */}
                               <div>
                                 <div className="flex justify-between items-center mb-3">
                                   <span className="text-xs font-bold text-primary">2. Property Adjustments</span>
                                   <button onClick={() => addCompAdjustment(comp._id, 'propertyAdjustments')} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+ Add</button>
                                 </div>
                                 <div className="space-y-2">
                                   {compAdjustments[comp._id].propertyAdjustments.map((adj, i) => (
                                     <div key={`pro-${i}`} className="flex space-x-2">
                                       <input placeholder="Reason (e.g. Condition)" value={adj.reason} onChange={e => updateCompAdjustment(comp._id, 'propertyAdjustments', i, 'reason', e.target.value)} className="w-1/2 p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                       <input type="number" placeholder="% (e.g. -2)" value={adj.percentage} onChange={e => updateCompAdjustment(comp._id, 'propertyAdjustments', i, 'percentage', e.target.value)} className="w-1/4 p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                       <input type="number" placeholder="Amt" value={adj.amount} onChange={e => updateCompAdjustment(comp._id, 'propertyAdjustments', i, 'amount', e.target.value)} className="w-1/4 p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                     </div>
                                   ))}
                                   {compAdjustments[comp._id].propertyAdjustments.length === 0 && <span className="text-xs text-slate-400">No property adjustments applied.</span>}
                                 </div>
                               </div>
                             </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                      <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-400 font-bold">No comparable properties found for this criteria.</p>
                      <button onClick={() => setStep(2)} className="mt-4 text-accent font-bold hover:underline">Adjust search criteria</button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-between items-center bg-slate-50 -mx-6 md:-mx-12 -mb-6 md:-mb-12 p-6 md:p-8 border-t border-slate-100 mt-8 md:mt-12 gap-4">
                  <button onClick={() => setStep(2)} className="text-slate-500 font-bold hover:text-primary transition w-full md:w-auto py-3">Back</button>
                  <button
                    onClick={finalizeValuation}
                    disabled={loading || selectedComps.length < 1}
                    className="bg-accent text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center w-full md:w-auto shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                    {loading ? 'Processing...' : 'Review Valuation'} {!loading && <ChevronRight size={20} className="ml-1" />}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && valuationResult && (
              <div className="p-6 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Valuation Calculation</h2>
                <p className="text-slate-500 mb-8 md:mb-10">Review the computation results and specific factors used in this {valuationResult.method}.</p>
                <div className="bg-slate-50 rounded-3xl p-6 md:p-8 mb-8 md:mb-10">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Methodology</span>
                    <span className="font-black text-primary px-3 py-1 bg-white rounded-lg shadow-sm border border-slate-100">{valuationResult.method}</span>
                  </div>

                  <div className="space-y-4">
                    {valuationResult.method === 'Comparable Sales' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Number of Comparables</span>
                          <span className="font-bold">{valuationResult.comparables?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Average Comparable Price</span>
                          <span className="font-bold">GHS {valuationResult.finalValue?.toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {valuationResult.method === 'Income Capitalization' && (
                      <>
                        {valuationResult.incomeData?.methodology === 'DCF' ? (
                           <>
                             <div className="flex justify-between text-sm">
                               <span className="text-slate-500">NPV of Cash Flows ({valuationResult.incomeData.dcfProjections?.length} Yrs)</span>
                               <span className="font-bold">GHS {Math.round(valuationResult.incomeData.dcfProjections?.reduce((a, b) => a + (b.presentValue || 0), 0) || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Discounted Terminal Value (Reversion)</span>
                               <span className="font-bold">GHS {Math.round(valuationResult.finalValue - (valuationResult.incomeData.dcfProjections?.reduce((a, b) => a + (b.presentValue || 0), 0) || 0)).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                               <span className="text-slate-600 font-bold">Total Present Value (DCF)</span>
                               <span className="font-black text-emerald-600">GHS {valuationResult.finalValue?.toLocaleString()}</span>
                             </div>
                           </>
                        ) : (
                           <>
                             <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Gross Rental Income</span>
                               <span className="font-bold">GHS {valuationResult.incomeData?.annualRentalIncome?.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Vacancy (Allowance)</span>
                               <span className="font-bold text-red-500">- {valuationResult.incomeData?.vacancyRate}%</span>
                             </div>
                             <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Operating Expenses</span>
                               <span className="font-bold text-red-500">- GHS {valuationResult.incomeData?.operatingExpenses?.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                               <span className="text-slate-600 font-bold">Net Operating Income</span>
                               <span className="font-black text-emerald-600">GHS {((valuationResult.incomeData?.annualRentalIncome * (1 - valuationResult.incomeData?.vacancyRate / 100)) - valuationResult.incomeData?.operatingExpenses).toLocaleString()}</span>
                             </div>
                           </>
                        )}
                      </>
                    )}

                    {valuationResult.method === 'Cost Method' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Land Market Value</span>
                          <span className="font-bold">GHS {valuationResult.costData?.landValue?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Construction Costs</span>
                          <span className="font-bold">GHS {(Number(valuationResult.costData?.directCosts) + Number(valuationResult.costData?.indirectCosts) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-500 pl-4 border-l-2 border-red-200 mt-2">
                          <span className="text-slate-500 text-xs">Physical Depreciation</span>
                          <span className="font-bold text-xs">- GHS {Math.round(valuationResult.costData?.depreciation?.physical || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-500 pl-4 border-l-2 border-red-200">
                          <span className="text-slate-500 text-xs">Functional/External Obsolescence</span>
                          <span className="font-bold text-xs">- GHS {(Number(valuationResult.costData?.depreciation?.functional || 0) + Number(valuationResult.costData?.depreciation?.external || 0)).toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {valuationResult.method === 'Residual Method' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Gross Development Value (GDV)</span>
                          <span className="font-black text-primary">GHS {valuationResult.residualData?.gdv?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4 border-l-2 border-red-200 mt-2">
                          <span className="text-slate-500 text-xs">Total Hard/Soft Costs</span>
                          <span className="font-bold text-xs text-red-500">- GHS {(Number(valuationResult.residualData?.constructionCosts || 0) + Number(valuationResult.residualData?.professionalFees || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4 border-l-2 border-red-200">
                          <span className="text-slate-500 text-xs">Finance Costs ({valuationResult.residualData?.financeDurationMonths} mo @ {valuationResult.residualData?.financeRate}%)</span>
                          <span className="font-bold text-xs text-red-500">- GHS {Math.round(valuationResult.residualData?.financeCosts || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4 border-l-2 border-red-200">
                          <span className="text-slate-500 text-xs">Target Developer Profit ({valuationResult.residualData?.developerProfitMargin}% margin)</span>
                          <span className="font-bold text-xs text-red-500">- GHS {Math.round(valuationResult.residualData?.developerProfit || 0).toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {valuationResult.method === 'Profit Method' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Business Net Profit</span>
                          <span className="font-bold text-emerald-600">GHS {(valuationResult.profitData?.grossAnnualRevenue - valuationResult.profitData?.purchases - valuationResult.profitData?.operatingExpenses).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4 border-l-2 border-red-200 mt-2">
                          <span className="text-slate-500 text-xs">Interest on Tenant Capital ({valuationResult.profitData?.tenantReturnRate}%)</span>
                          <span className="font-bold text-xs text-red-500">- GHS {Math.round(valuationResult.profitData?.tenantCapital * (valuationResult.profitData?.tenantReturnRate/100) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4 border-l-2 border-red-200">
                          <span className="text-slate-500 text-xs">Operator Remuneration Allowance</span>
                          <span className="font-bold text-xs text-red-500">- GHS {Math.round(valuationResult.profitData?.operatorRemuneration || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                          <span className="text-slate-600 font-bold">Divisible Balance</span>
                          <span className="font-black text-primary">GHS {Math.max(0, (valuationResult.profitData?.grossAnnualRevenue - valuationResult.profitData?.purchases - valuationResult.profitData?.operatingExpenses) - (valuationResult.profitData?.tenantCapital * (valuationResult.profitData?.tenantReturnRate/100)) - valuationResult.profitData?.operatorRemuneration).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-4">
                          <span className="text-slate-500">Capitalization Yield (Years Purchase)</span>
                          <span className="font-bold">{valuationResult.profitData?.capitalizationYield}% ({(100 / valuationResult.profitData?.capitalizationYield).toFixed(2)} YP)</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between pt-6 border-t border-slate-200">
                      <span className="text-primary font-black">Estimated Market Value</span>
                      <span className="text-accent font-black text-2xl">GHS {valuationResult.finalValue?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-between items-center bg-slate-50 -mx-6 md:-mx-12 -mb-6 md:-mb-12 p-6 md:p-8 border-t border-slate-100 mt-8 md:mt-12 gap-4">
                  <button onClick={() => setStep(2)} className="text-slate-500 font-bold hover:text-primary transition w-full md:w-auto py-3">Back</button>
                  <button
                    onClick={onFinalize}
                    className="bg-accent text-white px-10 py-5 rounded-3xl font-black flex items-center justify-center w-full md:w-auto shadow-xl shadow-blue-500/20 hover:scale-[1.03] active:scale-95 transition"
                  >
                    Confirm & Finalize <ChevronRight size={20} className="ml-1" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default ValuationWorkspace;
