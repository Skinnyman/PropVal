import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Plus,
  ChevronRight,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  Download,
  AlertCircle,
  Calculator,
  Home,
  Loader2
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ValuationWorkspace = () => {
  const location = useLocation();
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
            condition: p.propertyInfo?.condition || 'Good'
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
    condition: 'Good'
  });

  const [incomeData, setIncomeData] = useState({
    annualRentalIncome: '',
    vacancyRate: '',
    operatingExpenses: '',
    capRate: ''
  });

  const [costData, setCostData] = useState({
    landValue: '',
    constructionCostPerSqm: '',
    depreciation: ''
  });

  const [residualData, setResidualData] = useState({
    gdv: '',
    constructionCosts: '',
    professionalFees: '',
    financeCosts: '',
    developerProfit: ''
  });

  const [profitData, setProfitData] = useState({
    grossAnnualRevenue: '',
    operatingExpenses: '',
    capitalizationYield: ''
  });

  const onSubjectChange = (e) => {
    setSubject({ ...subject, [e.target.name]: e.target.value });
  };

  const onIncomeChange = (e) => setIncomeData({ ...incomeData, [e.target.name]: e.target.value });
  const onCostChange = (e) => setCostData({ ...costData, [e.target.name]: e.target.value });
  const onResidualChange = (e) => setResidualData({ ...residualData, [e.target.name]: e.target.value });
  const onProfitChange = (e) => setProfitData({ ...profitData, [e.target.name]: e.target.value });

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
    if (selectedComps.includes(id)) {
      setSelectedComps(selectedComps.filter(compId => compId !== id));
    } else {
      setSelectedComps([...selectedComps, id]);
    }
  };

  const finalizeValuation = async () => {
    setLoading(true);
    try {
      let endpoint = '/valuations/comparable';
      let payload = { subjectProperty: subject };

      if (method === 'Income Capitalization') {
        endpoint = '/valuations/income';
        payload.incomeData = {
          annualRentalIncome: Number(incomeData.annualRentalIncome),
          vacancyRate: Number(incomeData.vacancyRate),
          operatingExpenses: Number(incomeData.operatingExpenses),
          capRate: Number(incomeData.capRate)
        };
      } else if (method === 'Cost Method') {
        endpoint = '/valuations/cost';
        payload.costData = {
          landValue: Number(costData.landValue),
          constructionCostPerSqm: Number(costData.constructionCostPerSqm),
          depreciation: Number(costData.depreciation)
        };
      } else if (method === 'Residual Method') {
        endpoint = '/valuations/residual';
        payload.residualData = {
          gdv: Number(residualData.gdv),
          constructionCosts: Number(residualData.constructionCosts),
          professionalFees: Number(residualData.professionalFees),
          financeCosts: Number(residualData.financeCosts),
          developerProfit: Number(residualData.developerProfit)
        };
      } else if (method === 'Profit Method') {
        endpoint = '/valuations/profit';
        payload.profitData = {
          grossAnnualRevenue: Number(profitData.grossAnnualRevenue),
          operatingExpenses: Number(profitData.operatingExpenses),
          capitalizationYield: Number(profitData.capitalizationYield)
        };
      } else {
        payload.selectedComparables = selectedComps;
        payload.adjustments = selectedComps.map(id => ({ propertyId: id, adjustmentValue: 0 }));
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
    setStep(5);
  };

  const downloadReport = async () => {
    if (!valuationResult) return;
    try {
      const response = await api.get(`/valuations/${valuationResult._id}/report`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `valuation-report-${valuationResult._id}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Error downloading report:', err);
    }
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
                    <h3 className="text-xl font-bold text-primary mb-6 flex items-center">
                      <DollarSign className="text-accent mr-2" size={20} />
                      Income Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Annual Rent (GHS)</label>
                        <input
                          type="number" name="annualRentalIncome" value={incomeData.annualRentalIncome} onChange={onIncomeChange}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Vacancy Rate (%)</label>
                        <input
                          type="number" name="vacancyRate" value={incomeData.vacancyRate} onChange={onIncomeChange}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expenses (GHS)</label>
                        <input
                          type="number" name="operatingExpenses" value={incomeData.operatingExpenses} onChange={onIncomeChange}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cap Rate (%)</label>
                        <input
                          type="number" name="capRate" value={incomeData.capRate} onChange={onIncomeChange}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'Cost Method' && (
                  <div className="mt-10 pt-10 border-t border-slate-100">
                    <h3 className="text-xl font-bold text-primary mb-6 flex items-center">
                      <Home className="text-amber-500 mr-2" size={20} />
                      Cost Method Inputs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Land Value (GHS)</label>
                        <input
                          type="number" name="landValue" value={costData.landValue} onChange={onCostChange}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Const. Cost / sqm</label>
                        <input
                          type="number" name="constructionCostPerSqm" value={costData.constructionCostPerSqm} onChange={onCostChange}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Depreciation</label>
                        <input
                          type="number" name="depreciation" value={costData.depreciation} onChange={onCostChange}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold"
                        />
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
                        <input type="number" name="gdv" value={residualData.gdv} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Construction Costs</label>
                        <input type="number" name="constructionCosts" value={residualData.constructionCosts} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Professional Fees</label>
                        <input type="number" name="professionalFees" value={residualData.professionalFees} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Finance Costs</label>
                        <input type="number" name="financeCosts" value={residualData.financeCosts} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-[10px]">Developer Profit</label>
                        <input type="number" name="developerProfit" value={residualData.developerProfit} onChange={onResidualChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gross Annual Revenue</label>
                        <input type="number" name="grossAnnualRevenue" value={profitData.grossAnnualRevenue} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Operating Expenses</label>
                        <input type="number" name="operatingExpenses" value={profitData.operatingExpenses} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cap Yield (%)</label>
                        <input type="number" name="capitalizationYield" value={profitData.capitalizationYield} onChange={onProfitChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent transition font-bold" />
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

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-10">
                  {properties.length > 0 ? (
                    properties.map((comp) => (
                      <div
                        key={comp._id}
                        onClick={() => toggleComp(comp._id)}
                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition cursor-pointer group ${selectedComps.includes(comp._id) ? 'border-accent bg-blue-50/30' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${selectedComps.includes(comp._id) ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-accent/10 group-hover:text-accent'
                            }`}>
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
                          <span className="font-black text-emerald-600">GHS {(valuationResult.incomeData?.annualRentalIncome * (1 - valuationResult.incomeData?.vacancyRate / 100) - valuationResult.incomeData?.operatingExpenses).toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {valuationResult.method === 'Cost Method' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Land Market Value</span>
                          <span className="font-bold">GHS {valuationResult.costData?.landValue?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Replacement Cost (@ {valuationResult.costData?.constructionCostPerSqm}/sqm)</span>
                          <span className="font-bold">GHS {(valuationResult.costData?.constructionCostPerSqm * valuationResult.subjectProperty?.size)?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Accrued Depreciation</span>
                          <span className="font-bold text-red-500">- GHS {valuationResult.costData?.depreciation?.toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {valuationResult.method === 'Residual Method' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Gross Development Value (GDV)</span>
                          <span className="font-black text-primary">GHS {valuationResult.residualData?.gdv?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Development Costs</span>
                          <span className="font-bold text-red-500">- GHS {(Number(valuationResult.residualData?.constructionCosts) + Number(valuationResult.residualData?.professionalFees) + Number(valuationResult.residualData?.financeCosts) + Number(valuationResult.residualData?.developerProfit)).toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {valuationResult.method === 'Profit Method' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Business Net Profit</span>
                          <span className="font-black text-emerald-600">GHS {(valuationResult.profitData?.grossAnnualRevenue - valuationResult.profitData?.operatingExpenses).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Capitalization Yield</span>
                          <span className="font-bold">{valuationResult.profitData?.capitalizationYield}%</span>
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

            {step === 5 && valuationResult && (
              <div className="p-6 md:p-12 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-center mb-8 md:mb-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-100 shadow-xl">
                    <ShieldCheck size={40} className="md:w-12 md:h-12" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-primary mb-2 text-center">Valuation Finalized</h2>
                <p className="text-slate-500 text-center mb-8 md:mb-12 text-sm md:text-base">Your professional valuation report is ready for download.</p>

                <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white mb-8 md:mb-10 relative overflow-hidden">
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center text-center md:text-left">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-2">Total Estimated Value</p>
                      <h3 className="text-4xl md:text-5xl font-black text-accent">GHS {valuationResult.finalValue?.toLocaleString()}</h3>
                      <p className="text-slate-400 mt-4 text-sm leading-relaxed">
                        Report ID: <span className="text-white font-mono">{valuationResult._id}</span><br />
                        Generated on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={downloadReport}
                        className="w-full flex items-center justify-center space-x-3 p-6 bg-accent text-white rounded-3xl font-black shadow-xl shadow-blue-500/20 hover:scale-[1.05] transition active:scale-95"
                      >
                        <Download size={24} />
                        <span>Download PDF Report</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center border-t border-slate-100 pt-8 mt-8">
                  <button onClick={() => {
                    setStep(1);
                    setSelectedComps([]);
                    setValuationResult(null);
                  }} className="text-slate-500 font-bold hover:text-primary transition">New Valuation Project</button>
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
