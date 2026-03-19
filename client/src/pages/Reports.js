import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FileText, FileCheck, Printer, Download, User, ChevronRight } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [valuations, setValuations] = useState([]);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [selectedValuation, setSelectedValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [valuerDetails, setValuerDetails] = useState({
    name: user?.name || '',
    firm: 'Ghana Valuation Associates Ltd',
    purpose: 'Mortgage Security'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [valuationsRes, propertiesRes] = await Promise.all([
          api.get('/valuations'),
          api.get('/properties')
        ]);
        setValuations(valuationsRes.data);
        setPropertiesCount(Array.isArray(propertiesRes.data) ? propertiesRes.data.length : 0);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-report');
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Valuation_Report_${selectedValuation.subjectProperty?.suburb || 'Property'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b px-4 pl-16 md:px-8 py-4 md:py-5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-500">Report Generator</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
              {propertiesCount} Properties
            </div>
            <div className="flex items-center px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
              {valuations.length} Valuations
            </div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase">
              {user?.subscriptionStatus || 'Professional'}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 max-w-[1600px] mx-auto">
          <div className="mb-10">
            <h1 className="text-2xl font-black text-[#0f172a] mb-2 font-display">Valuation Report Generator</h1>
            <p className="text-slate-400 text-sm font-medium tracking-tight">Generate a professional valuation report from your completed assessments.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls Pane */}
            <div className="lg:col-span-4 space-y-8">
              {/* 1. Select Valuation */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-8 flex items-center">
                  <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] mr-3">1</span>
                  Select Valuation
                </h3>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : valuations.length > 0 ? (
                    valuations.map((val) => (
                      <div 
                        key={val._id}
                        onClick={() => setSelectedValuation(val)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedValuation?._id === val._id ? 'border-accent bg-blue-50/50 shadow-lg shadow-blue-500/5' : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <h4 className={`font-bold text-sm truncate ${selectedValuation?._id === val._id ? 'text-accent' : 'text-primary'}`}>
                              {val.subjectProperty?.suburb || 'N/A'}, {val.subjectProperty?.region || 'N/A'}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {new Date(val.createdAt).toLocaleDateString()} • {val.method}
                            </p>
                          </div>
                          <ChevronRight size={14} className={`text-slate-300 transition-transform ${selectedValuation?._id === val._id ? 'translate-x-1 text-accent' : ''}`} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-100">
                      <p className="text-slate-400 text-xs font-bold leading-relaxed">No valuations yet. Use the calculator first.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Valuer Details */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-8 flex items-center">
                  <span className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-[10px] mr-3">2</span>
                  Valuer Details
                </h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valuer Name</label>
                    <input 
                      type="text" 
                      value={valuerDetails.name}
                      onChange={(e) => setValuerDetails({...valuerDetails, name: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-5 py-3 focus:border-accent transition outline-none font-bold text-sm text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firm / Organisation</label>
                    <input 
                      type="text" 
                      value={valuerDetails.firm}
                      onChange={(e) => setValuerDetails({...valuerDetails, firm: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-5 py-3 focus:border-accent transition outline-none font-bold text-sm text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose of Valuation</label>
                    <select 
                      value={valuerDetails.purpose}
                      onChange={(e) => setValuerDetails({...valuerDetails, purpose: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-5 py-3 focus:border-accent transition outline-none font-bold text-sm text-primary"
                    >
                      <option>Mortgage Security</option>
                      <option>Open Market Sale</option>
                      <option>Insurance Replacement</option>
                      <option>Probate / Estate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={!selectedValuation}
                  className={`w-full py-5 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all duration-300 shadow-xl ${selectedValuation ? 'bg-accent text-white hover:bg-blue-700 shadow-blue-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <Download size={20} />
                  <span>Download PDF Report</span>
                </button>

                <button 
                  onClick={handlePrint}
                  disabled={!selectedValuation}
                  className={`w-full py-5 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all duration-300 border-2 ${selectedValuation ? 'border-primary text-primary hover:bg-slate-50' : 'border-slate-100 text-slate-300 cursor-not-allowed'}`}
                >
                  <Printer size={20} />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            {/* Right Preview Pane */}
            <div className="lg:col-span-8 overflow-hidden">
              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-2xl min-h-[600px] md:min-h-[800px] flex flex-col relative print:border-0 print:shadow-none overflow-x-auto md:overflow-hidden">
                <div className="min-w-[800px] md:min-w-0 scale-[0.6] sm:scale-[0.8] md:scale-100 origin-top-left md:origin-top w-[166%] sm:w-[125%] md:w-full">
                {!selectedValuation ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-40">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                       <FileText size={48} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold max-w-xs leading-relaxed">Select a valuation to preview the report</p>
                  </div>
                ) : (
                  <div id="printable-report" className="flex-1 p-16 relative">
                    {/* Report Header */}
                    <div className="flex justify-between items-start mb-16 border-b pb-12 border-slate-100">
                      <div>
                        <div className="w-16 h-16 bg-[#0f172a] rounded-2xl mb-6 flex items-center justify-center text-white font-black text-xs">
                          PV-GH
                        </div>
                        <h2 className="text-3xl font-black text-primary mb-2">VALUATION REPORT</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Private & Confidential</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">REPORT ID</p>
                        <p className="font-bold text-sm text-primary">{selectedValuation._id.substring(selectedValuation._id.length - 8).toUpperCase()}</p>
                        <p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">DATE OF VALUATION</p>
                        <p className="font-bold text-sm text-primary">{new Date(selectedValuation.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Report Body */}
                    <div className="grid grid-cols-2 gap-16 mb-16">
                      <div className="space-y-10">
                        <div>
                          <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4">Subject Property</h4>
                          <h5 className="text-xl font-bold text-primary mb-2">{selectedValuation.subjectProperty?.suburb || 'N/A'}</h5>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {selectedValuation.subjectProperty?.district}, {selectedValuation.subjectProperty?.region}
                            <br />Ghana
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                              <p className="text-xs font-bold text-primary">{selectedValuation.subjectProperty?.propertyType}</p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Size</p>
                              <p className="text-xs font-bold text-primary">{selectedValuation.subjectProperty?.size} sqm</p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Methodology</p>
                              <p className="text-xs font-bold text-primary">{selectedValuation.method}</p>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Condition</p>
                              <p className="text-xs font-bold text-primary">{selectedValuation.subjectProperty?.condition}</p>
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-end">
                        <div className="bg-[#f8fafc] border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Market Value (GHS)</p>
                           <h2 className="text-5xl font-black text-[#0f172a]">{selectedValuation.finalValue?.toLocaleString()}</h2>
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-6 bg-emerald-50 py-2 px-4 rounded-full inline-block">Professional Estimate</p>
                        </div>
                      </div>
                    </div>

                    {/* Report Footer / Signature */}
                    <div className="mt-auto pt-16 border-t border-slate-100 flex items-center justify-between">
                       <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-slate-200">
                             <User size={24} className="text-slate-300" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-primary">{valuerDetails.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{valuerDetails.firm}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Platform Verification</p>
                          <div className="flex items-center text-emerald-500 space-x-2 justify-end">
                             <FileCheck size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">A.I.S Compliant</span>
                          </div>
                       </div>
                    </div>

                    {/* Watermark bg */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none rotate-12 scale-[3]">
                        <h2 className="text-[200px] font-black text-[#0f172a]">PROPVAL</h2>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { 
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm !important;
            margin: 0 !important;
          }
          .Sidebar, header, .lg\\:col-span-4 { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default Reports;
