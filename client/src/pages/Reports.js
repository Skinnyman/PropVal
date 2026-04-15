import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FileText, Printer, Download, ChevronRight, FileCode, Trash2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { generateWordReport } from '../utils/generateWordReport';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [valuations, setValuations] = useState([]);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [selectedValuation, setSelectedValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [valuerDetails, setValuerDetails] = useState({
    name: user?.name || '',
    firm: 'Ghana Valuation Associates Ltd',
    purpose: 'Mortgage Security',
    clientName: 'The Manager, Bank of Africa',
    clientAddress: 'P.O Box 123, Accra',
    digitalAddress: 'GA-000-0000',
    dateOfInspection: new Date().toISOString().split('T')[0],
    dateOfValuation: new Date().toISOString().split('T')[0],
    titleParticulars: 'Unexpired Leasehold Interest',
    neighbourhoodData: 'A predominantly residential neighbourhood with mixed developments.',
    scheduleOfAccommodation: 'Living room, Kitchen, 3 Bedrooms, 2 Bathrooms.'
  });

  const [base64Images, setBase64Images] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    const convertImagesToBase64 = async () => {
      if (!selectedValuation?.subjectProperty?.images?.length) {
        setBase64Images([]);
        return;
      }
      setLoadingImages(true);
      try {
        const urls = selectedValuation.subjectProperty.images;
        const b64Array = await Promise.all(
          urls.map(async (url) => {
            const res = await fetch(url);
            const blob = await res.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          })
        );
        setBase64Images(b64Array.filter(Boolean));
      } catch (err) {
        console.error("Failed to fetch Base64 images:", err);
      } finally {
        setLoadingImages(false);
      }
    };
    convertImagesToBase64();
  }, [selectedValuation]);

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

  const handleDeleteValuation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this valuation?')) return;
    try {
      await api.delete(`/valuations/${id}`);
      setValuations(valuations.filter(v => v._id !== id));
      if (selectedValuation?._id === id) setSelectedValuation(null);
    } catch (err) {
      console.error('Error deleting valuation:', err);
      alert('Failed to delete valuation. Please try again.');
    }
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
                              {new Date(val.createdAt).toLocaleString()} • {val.method}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                             <button onClick={(e) => handleDeleteValuation(val._id, e)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition" title="Delete Valuation">
                               <Trash2 size={14} />
                             </button>
                             <ChevronRight size={14} className={`text-slate-300 transition-transform ${selectedValuation?._id === val._id ? 'translate-x-1 text-accent' : ''}`} />
                          </div>
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

                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-accent border-b pb-1">Client & Letter Addressee</h4>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                       <input value={valuerDetails.clientName} onChange={(e) => setValuerDetails({...valuerDetails, clientName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Address</label>
                       <input value={valuerDetails.clientAddress} onChange={(e) => setValuerDetails({...valuerDetails, clientAddress: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-accent border-b pb-1">Valuation Context</h4>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose of Valuation</label>
                       <select value={valuerDetails.purpose} onChange={(e) => setValuerDetails({...valuerDetails, purpose: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs">
                          <option>Mortgage Security</option>
                          <option>Open Market Sale</option>
                          <option>Insurance Replacement</option>
                          <option>Probate / Estate</option>
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Inspection</label>
                          <input type="date" value={valuerDetails.dateOfInspection} onChange={(e) => setValuerDetails({...valuerDetails, dateOfInspection: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Valuation</label>
                          <input type="date" value={valuerDetails.dateOfValuation} onChange={(e) => setValuerDetails({...valuerDetails, dateOfValuation: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-accent border-b pb-1">Property Specifics</h4>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title Particulars / Legal Interest</label>
                       <input value={valuerDetails.titleParticulars} onChange={(e) => setValuerDetails({...valuerDetails, titleParticulars: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Digital Address</label>
                       <input value={valuerDetails.digitalAddress} onChange={(e) => setValuerDetails({...valuerDetails, digitalAddress: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Neighbourhood Data</label>
                       <textarea rows="2" value={valuerDetails.neighbourhoodData} onChange={(e) => setValuerDetails({...valuerDetails, neighbourhoodData: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Schedule of Accomodation</label>
                       <textarea rows="2" value={valuerDetails.scheduleOfAccommodation} onChange={(e) => setValuerDetails({...valuerDetails, scheduleOfAccommodation: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-accent border-b pb-1">Signatory Details</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valuer Name</label>
                      <input value={valuerDetails.name} onChange={(e) => setValuerDetails({...valuerDetails, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firm / Organisation</label>
                      <input value={valuerDetails.firm} onChange={(e) => setValuerDetails({...valuerDetails, firm: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 focus:border-accent transition outline-none font-bold text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={!selectedValuation}
                    className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all shadow-xl ${selectedValuation ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    <Download size={16} />
                    <span className="text-xs">PDF</span>
                  </button>

                  <button 
                    onClick={() => generateWordReport(selectedValuation, valuerDetails, base64Images)}
                    disabled={!selectedValuation || loadingImages}
                    className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all shadow-xl ${selectedValuation && !loadingImages ? 'bg-[#2b579a] text-white hover:bg-blue-800 shadow-blue-900/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    <FileCode size={16} />
                    <span className="text-xs">Word DOCX</span>
                  </button>
                </div>

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
                  <div id="printable-report" className="flex-1 w-full bg-white relative">
                    {/* COVER PAGE */}
                    <div className="p-16 h-[297mm] flex flex-col items-center justify-center text-center relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm">
                      <h1 className="text-5xl font-black text-primary mb-6">VALUATION REPORT</h1>
                      <div className="w-24 h-1 bg-accent mb-6 mx-auto"></div>
                      <p className="text-xl font-bold text-slate-500 mb-12">Private & Confidential</p>
                      
                      <h3 className="text-2xl font-black text-primary mt-12 mb-2">{selectedValuation.subjectProperty?.suburb || 'Property Location'}</h3>
                      <p className="text-lg text-slate-500 font-medium mb-12">
                        {selectedValuation.subjectProperty?.district}, {selectedValuation.subjectProperty?.region}
                      </p>
                      
                      <p className="text-sm font-bold text-slate-400 mt-20">Prepared for:</p>
                      <h4 className="text-xl font-black text-primary my-2">{valuerDetails.clientName}</h4>
                      
                      <div className="mt-auto pt-16">
                        <p className="font-bold text-primary">{new Date(selectedValuation.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs uppercase font-black text-slate-300 mt-2 tracking-widest">Report ID: {selectedValuation._id.substring(selectedValuation._id.length - 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>

                    {/* TABLE OF CONTENTS PAGE */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-24 text-primary">
                      <h2 className="text-2xl font-black mb-12 text-center uppercase tracking-widest border-b pb-4">Table of Contents</h2>
                      <div className="space-y-6 text-sm font-bold flex-1">
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>1. PICTURES</span><span>3</span></div>
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>2. LETTER OF TRANSMITTAL</span><span>4</span></div>
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>3. INTRODUCTION / SUMMARY OF KEY DATA</span><span>5</span></div>
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>4. CHAPTER TWO: PROFILE OF CITY, LOCATION & DETAILS</span><span>6</span></div>
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>5. CHAPTER THREE: VALUATION PROCESS / METHODOLOGY</span><span>7</span></div>
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>6. CHAPTER FOUR: VALUATION CALCULATION BREAKDOWN</span><span>8</span></div>
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>7. VALUATION CERTIFICATION</span><span>9</span></div>
                        <div className="flex justify-between items-end border-b border-dotted border-slate-300 pb-1"><span>8. APPENDICES</span><span>10</span></div>
                      </div>
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>

                    {/* PICTURES PAGE */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-24 text-primary">
                      <h2 className="text-2xl font-black mb-12 text-center uppercase tracking-widest border-b pb-4">Pictures of Subject Property</h2>
                      {loadingImages ? (
                        <div className="flex justify-center py-20 text-slate-400 font-bold">
                           <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mr-3"></div>
                           Processing high-resolution images...
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-8">
                          {base64Images.length > 0 ? (
                             base64Images.map((b64, i) => (
                               <img key={i} src={b64} alt={`Property view ${i+1}`} className="w-full h-64 object-cover rounded-xl shadow-md border-4 border-slate-100" />
                             ))
                          ) : (
                             <div className="col-span-2 text-center text-slate-400 italic py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                               No photographs are currently attached to this valuation record.
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>

                    {/* TRANSMITTAL PAGE */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-24 text-primary">
                      <h2 className="text-2xl font-black mb-12 text-center uppercase tracking-widest border-b pb-4">Letter of Transmittal</h2>
                      <div className="text-sm space-y-6 leading-relaxed">
                        <p className="font-bold">{valuerDetails.clientName}<br/>{valuerDetails.clientAddress}</p>
                        <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                        <p>Dear Sir/Madam,</p>
                        <p className="font-black underline">VALUATION OF PROPERTY AT {selectedValuation.subjectProperty?.suburb?.toUpperCase()}</p>
                        <p>In accordance with your written instructions, we have attended the above-mentioned real estate asset and carried out the necessary inspections, investigations, and analysis to ascertain its Open Market Value. The assessment was undertaken strictly for {valuerDetails.purpose.toLowerCase()} purposes.</p>
                        <p>We have pleasure in submitting this comprehensive report, which details our methodology, our findings regarding the statutory and physical nature of the property, and our final professional opinion of value. We certify that we have acted as independent valuers and that the assessment accurately reflects the current market dynamics in the subject locality.</p>
                        <div className="mt-12">
                          <p>Yours faithfully,</p>
                          <div className="h-16 mt-4"></div> {/* Signature space */}
                          <p className="font-black">{valuerDetails.name}</p>
                          <p className="text-slate-500 font-bold">{valuerDetails.firm}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>

                    {/* SUMMARY OF DATA */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-12 text-primary">
                      <h2 className="text-xl font-black mb-6 text-center uppercase tracking-widest border-b pb-4">Summary of Key Data</h2>
                      <div className="space-y-4 text-[13px] leading-relaxed">
                        <div><span className="font-black">Request for Valuation:</span> This valuation exercise was commissioned by {valuerDetails.clientName}. Our mandate is to determine the Open Market Value and Forced Sale Value of the subject property to guide critical decision-making regarding the asset.</div>
                        <div><span className="font-black">Nature of Assets:</span> The subject asset comprises a high-end residential dwelling structure. It exhibits modern architectural design, built of solid sandcrete blockwork with reinforced concrete columns, and is situated within a well-defined, secure walled compound.</div>
                        <div><span className="font-black">Purpose of Valuation:</span> The primary objective of this report is to provide a professional opinion of the Open Market Value of the legal interest. This is rendered strictly for {valuerDetails.purpose} purposes.</div>
                        <div className="grid grid-cols-3 mt-4"><div className="font-bold text-slate-500 pr-2">Digital Address</div><div className="col-span-2 font-bold">{valuerDetails.digitalAddress}</div></div>
                        <div className="grid grid-cols-3"><div className="font-bold text-slate-500 pr-2">Date of Inspection</div><div className="col-span-2 font-bold">{valuerDetails.dateOfInspection}</div></div>
                        <div className="grid grid-cols-3"><div className="font-bold text-slate-500 pr-2">Date of Valuation</div><div className="col-span-2 font-bold">{valuerDetails.dateOfValuation}</div></div>
                        <div className="grid grid-cols-3"><div className="font-bold text-slate-500 pr-2">Land Area</div><div className="col-span-2 font-bold">{selectedValuation.subjectProperty?.landSize} sqm</div></div>
                        <div className="grid grid-cols-3"><div className="font-bold text-slate-500 pr-2">Basis of Valuation</div><div className="col-span-2 font-bold">Open Market Value</div></div>
                        <div className="grid grid-cols-3"><div className="font-bold text-slate-500 pr-2">Title Particulars</div><div className="col-span-2 font-bold">{valuerDetails.titleParticulars}</div></div>
                      </div>
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>

                    {/* CHAPTER TWO & THREE */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-12 text-primary">
                      <h2 className="text-xl font-black mb-4 text-center uppercase tracking-widest border-b pb-4">Chapter Two: Profile & Details</h2>
                      <div className="space-y-3 text-[13px] leading-relaxed mb-8">
                        <p><span className="font-black">Location of Property:</span> The subject property is located within {selectedValuation.subjectProperty?.suburb}, a prominent district situated within the {selectedValuation.subjectProperty?.district} of the {selectedValuation.subjectProperty?.region}. Geographically, it enjoys proximity to major arterial roads and commercial landmarks.</p>
                        <p><span className="font-black">Neighbourhood Data:</span> {valuerDetails.neighbourhoodData} The area benefits from a comprehensive array of civic and infrastructural amenities. The socio-economic profile of the locality features a vibrant secondary real estate market characterized by robust demand dynamics.</p>
                        <p><span className="font-black">Property Description:</span> The subject property comprises a {selectedValuation.subjectProperty?.condition?.toLowerCase()} condition {selectedValuation.subjectProperty?.propertyType}. It has a total floor size of {selectedValuation.subjectProperty?.size} sqm. The external walls are rendered and finished with high-grade acrylic emulsion paint. Internally, the accommodation is generously proportioned with porcelain floors and suspended ceilings.</p>
                      </div>

                      <h2 className="text-xl font-black mb-4 text-center uppercase tracking-widest border-b pb-4">Chapter Three: Methodology</h2>
                      <div className="space-y-3 text-[13px] leading-relaxed">
                        <p><span className="font-black">Basis of Valuation:</span> The basis of valuation is the Market Value which is defined as the estimated amount for which an asset should exchange on the valuation date between a willing buyer and seller in an arm's length transaction, after proper marketing. We also state the Forced Sale Value mapping probable realizable price in constrained timeframe.</p>
                        <p><span className="font-black">Valuation Method Adopted:</span> The approach adopted in arriving at the Open Market Value is the <span className="font-black underline">{selectedValuation.method}</span> Approach. This methodology was deemed the most robust and accurate. Raw market data was meticulously adjusted to account for slight dissimilarities between comparables and the subject property. Positive and negative quantitative adjustments were applied for variables including exact location gradients, plot size, conditions, and architectural superiority.</p>
                      </div>
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>

                    {/* CHAPTER FOUR: CALCULATIONS */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-12 text-primary">
                      <h2 className="text-xl font-black mb-6 text-center uppercase tracking-widest border-b pb-4">Chapter Four: Calculation Breakdown</h2>
                      <div className="text-[13px] leading-relaxed flex-1">
                         <p className="mb-6">The following details the specific mathematical application of the <span className="font-bold">{selectedValuation.method}</span> utilized to derive the final Open Market Value.</p>
                         
                         {selectedValuation.method === 'Income Capitalization' && (
                           <div className="space-y-4">
                             {selectedValuation.incomeData?.methodology === 'DCF' ? (
                               <>
                                 <h4 className="font-bold border-b pb-2 mb-4">Multi-Year Discounted Cash Flow (DCF) Analysis</h4>
                                 <table className="w-full text-left text-xs mb-6 border-collapse">
                                   <thead>
                                     <tr className="bg-slate-100 uppercase tracking-wider">
                                       <th className="p-2 border">Year</th>
                                       <th className="p-2 border">Gross Income (GHS)</th>
                                       <th className="p-2 border">Expenses (GHS)</th>
                                       <th className="p-2 border">NOI (GHS)</th>
                                       <th className="p-2 border">Discount Rate</th>
                                       <th className="p-2 border text-right">Present Value (GHS)</th>
                                     </tr>
                                   </thead>
                                   <tbody>
                                     {selectedValuation.incomeData?.dcfProjections?.map((proj, i) => (
                                        <tr key={i} className="border-b">
                                          <td className="p-2 border">{proj.year}</td>
                                          <td className="p-2 border">{proj.grossIncome.toLocaleString()}</td>
                                          <td className="p-2 border">{proj.expenses.toLocaleString()}</td>
                                          <td className="p-2 border font-bold">{proj.netOperatingIncome.toLocaleString()}</td>
                                          <td className="p-2 border">{proj.discountRate}%</td>
                                          <td className="p-2 border text-right font-bold text-accent">{Math.round(proj.presentValue).toLocaleString()}</td>
                                        </tr>
                                     ))}
                                   </tbody>
                                 </table>
                                 <div className="flex justify-between border-b pb-2 mb-2"><span className="font-bold">Sum of PV of Cash Flows:</span> <span>GHS {Math.round(selectedValuation.incomeData?.dcfProjections?.reduce((a, b) => a + (b.presentValue || 0), 0) || 0).toLocaleString()}</span></div>
                                 <div className="flex justify-between border-b pb-2 mb-2"><span className="font-bold">Terminal Value / Reversion (Discounted):</span> <span>GHS {Math.round(selectedValuation.finalValue - (selectedValuation.incomeData?.dcfProjections?.reduce((a, b) => a + (b.presentValue || 0), 0) || 0)).toLocaleString()}</span></div>
                                 <div className="flex justify-between pt-2 text-lg"><span className="font-black">Total Market Value:</span> <span className="font-black text-emerald-600">GHS {selectedValuation.finalValue?.toLocaleString()}</span></div>
                               </>
                             ) : (
                               <>
                                 <h4 className="font-bold border-b pb-2 mb-4">Direct Capitalization</h4>
                                 <div className="flex justify-between border-b pb-2 mb-2"><span>Gross Rental Income:</span> <span className="font-bold">GHS {selectedValuation.incomeData?.annualRentalIncome?.toLocaleString()}</span></div>
                                 <div className="flex justify-between border-b pb-2 mb-2"><span>Less Void/Vacancy Allowance ({selectedValuation.incomeData?.vacancyRate}%):</span> <span className="font-bold text-red-500">- GHS {((selectedValuation.incomeData?.annualRentalIncome * selectedValuation.incomeData?.vacancyRate) / 100).toLocaleString()}</span></div>
                                 <div className="flex justify-between border-b pb-2 mb-2"><span>Less Operating Expenses:</span> <span className="font-bold text-red-500">- GHS {selectedValuation.incomeData?.operatingExpenses?.toLocaleString()}</span></div>
                                 <div className="flex justify-between border-b pb-2 mb-2 bg-slate-50 p-2"><span className="font-bold">True Net Operating Income (NOI):</span> <span className="font-bold text-emerald-600">GHS {((selectedValuation.incomeData?.annualRentalIncome * (1 - selectedValuation.incomeData?.vacancyRate / 100)) - selectedValuation.incomeData?.operatingExpenses).toLocaleString()}</span></div>
                                 <div className="flex justify-between border-b pb-2 mb-2"><span>Capitalization Rate:</span> <span className="font-bold border px-2 border-slate-200">{selectedValuation.incomeData?.capRate}%</span></div>
                                 <div className="flex justify-between pt-2 text-lg"><span className="font-black">Market Value (NOI / Cap Rate):</span> <span className="font-black text-emerald-600">GHS {selectedValuation.finalValue?.toLocaleString()}</span></div>
                               </>
                             )}
                           </div>
                         )}

                         {selectedValuation.method === 'Comparable Sales' && (
                           <div className="space-y-4">
                              <h4 className="font-bold border-b pb-2 mb-4">Sequential Market Adjustments</h4>
                              <p className="mb-4 text-xs">The following adjustment matrix was applied to {selectedValuation.adjustments?.length} comparable properties. Transaction adjustments (e.g. market timing) were applied first, followed by Additive Property adjustments (e.g. physical condition).</p>
                              
                              <table className="w-full text-left text-[10px] mb-6 border-collapse">
                                <thead>
                                 <tr className="bg-slate-100 font-bold">
                                   <th className="p-2 border">Ref</th>
                                   <th className="p-2 border">Base Price</th>
                                   <th className="p-2 border">Transaction Adjs.</th>
                                   <th className="p-2 border">Property Adjs.</th>
                                   <th className="p-2 border text-right">Net Adjusted Price</th>
                                 </tr>
                                </thead>
                                <tbody>
                                 {selectedValuation.adjustments?.map((adj, i) => (
                                   <tr key={i} className="border-b">
                                     <td className="p-2 border font-bold">Comp {i+1}</td>
                                     <td className="p-2 border">GHS {(adj.adjustedPrice - adj.netAdjustment).toLocaleString()}</td>
                                     <td className="p-2 border text-red-500">
                                       {adj.transactionAdjustments?.map((t, ti) => <div key={ti}>{t.reason}: {t.percentage ? `${t.percentage}%` : `GHS ${t.amount}`}</div>)}
                                     </td>
                                     <td className="p-2 border text-blue-500">
                                       {adj.propertyAdjustments?.map((t, ti) => <div key={ti}>{t.reason}: {t.percentage ? `${t.percentage}%` : `GHS ${t.amount}`}</div>)}
                                     </td>
                                     <td className="p-2 border text-right font-black text-emerald-600">GHS {Math.round(adj.adjustedPrice).toLocaleString()}</td>
                                   </tr>
                                 ))}
                                </tbody>
                              </table>
                              <p className="font-bold text-xs bg-slate-50 p-3 italic">Weights applied mathematically against gross adjustment deviations to reconcile Open Market Value at GHS {selectedValuation.finalValue?.toLocaleString()}.</p>
                           </div>
                         )}

                         {selectedValuation.method === 'Cost Method' && (
                           <div className="space-y-4">
                             <h4 className="font-bold border-b pb-2 mb-4">Depreciated Replacement Cost Breakdown</h4>
                             <div className="flex justify-between border-b pb-2 mb-2"><span>Open Market Land Value:</span> <span className="font-bold">GHS {selectedValuation.costData?.landValue?.toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2"><span>Gross Replacement Costs (Direct + Indirect):</span> <span className="font-bold">GHS {(Number(selectedValuation.costData?.directCosts || 0) + Number(selectedValuation.costData?.indirectCosts || 0)).toLocaleString()}</span></div>
                             <h5 className="font-bold mt-4 mb-2 text-xs text-red-600 uppercase tracking-widest">Less Depreciation (3-Tier Obsolescence)</h5>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- Physical Depreciation (Age-Life):</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.costData?.depreciation?.physical || 0).toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- Functional Obsolescence:</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.costData?.depreciation?.functional || 0).toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- External / Economic Obsolescence:</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.costData?.depreciation?.external || 0).toLocaleString()}</span></div>
                             <div className="flex justify-between pt-2 text-lg mt-4 border-t-2"><span className="font-black">Total DRC Value:</span> <span className="font-black text-emerald-600">GHS {selectedValuation.finalValue?.toLocaleString()}</span></div>
                           </div>
                         )}

                         {selectedValuation.method === 'Residual Method' && (
                           <div className="space-y-4">
                             <h4 className="font-bold border-b pb-2 mb-4">Residual Site Analysis</h4>
                             <div className="flex justify-between border-b pb-2 mb-2"><span>Gross Development Value (GDV):</span> <span className="font-black text-lg">GHS {selectedValuation.residualData?.gdv?.toLocaleString()}</span></div>
                             <h5 className="font-bold mt-4 mb-2 text-xs text-red-600 uppercase tracking-widest">Less Development Costs & Margins</h5>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- Hard Construction Costs:</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.residualData?.constructionCosts || 0).toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- Soft/Professional Fees:</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.residualData?.professionalFees || 0).toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- S-Curve Finance Cost ({selectedValuation.residualData?.financeDurationMonths} months @ {selectedValuation.residualData?.financeRate}%):</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.residualData?.financeCosts || 0).toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- Target Developer Profit (Margin: {selectedValuation.residualData?.developerProfitMargin}%):</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.residualData?.developerProfit || 0).toLocaleString()}</span></div>
                             <div className="flex justify-between pt-2 text-lg mt-4 border-t-2"><span className="font-black">Residual Land Value:</span> <span className="font-black text-emerald-600">GHS {selectedValuation.finalValue?.toLocaleString()}</span></div>
                           </div>
                         )}

                         {selectedValuation.method === 'Profit Method' && (
                           <div className="space-y-4">
                             <h4 className="font-bold border-b pb-2 mb-4">Divisible Balance Assessment</h4>
                             <div className="flex justify-between border-b pb-2 mb-2"><span>Gross Annual Revenue:</span> <span className="font-bold">GHS {selectedValuation.profitData?.grossAnnualRevenue?.toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2"><span>Purchases / Cost of Goods:</span> <span className="font-bold text-red-500">- GHS {selectedValuation.profitData?.purchases?.toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2"><span>Operating Expenses:</span> <span className="font-bold text-red-500">- GHS {selectedValuation.profitData?.operatingExpenses?.toLocaleString()}</span></div>
                             <h5 className="font-bold mt-4 mb-2 text-xs text-red-600 uppercase tracking-widest">Less Non-Transferable Allowances</h5>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- Interest on Tenant Capital ({selectedValuation.profitData?.tenantReturnRate}% on GHS {selectedValuation.profitData?.tenantCapital}):</span> <span className="font-bold text-red-500">GHS {Math.round((selectedValuation.profitData?.tenantReturnRate/100) * (selectedValuation.profitData?.tenantCapital || 0)).toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2 pl-4 text-xs"><span>- Operator / Manager Remuneration:</span> <span className="font-bold text-red-500">GHS {Math.round(selectedValuation.profitData?.operatorRemuneration || 0).toLocaleString()}</span></div>
                             
                             <div className="flex justify-between border-b pb-2 mb-2 mt-4 bg-slate-50 p-2"><span className="font-black">Divisible Balance (True Rent):</span> <span className="font-black text-primary">GHS {Math.max(0, (selectedValuation.profitData?.grossAnnualRevenue - selectedValuation.profitData?.purchases - selectedValuation.profitData?.operatingExpenses) - ((selectedValuation.profitData?.tenantReturnRate/100) * (selectedValuation.profitData?.tenantCapital || 0)) - selectedValuation.profitData?.operatorRemuneration).toLocaleString()}</span></div>
                             <div className="flex justify-between border-b pb-2 mb-2"><span>Capitalization Yield (YP):</span> <span className="font-bold border px-2 border-slate-200">{selectedValuation.profitData?.capitalizationYield}% ({(100 / (selectedValuation.profitData?.capitalizationYield || 10)).toFixed(2)} YP)</span></div>
                             <div className="flex justify-between pt-2 text-lg mt-4 border-t-2"><span className="font-black">Total Market Value:</span> <span className="font-black text-emerald-600">GHS {selectedValuation.finalValue?.toLocaleString()}</span></div>
                           </div>
                         )}

                      </div>
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>

                    {/* VALUATION CERTIFICATION */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-24 text-primary text-center justify-center">
                      <h2 className="text-3xl font-black mb-12 text-center uppercase tracking-[0.2em] border-b pb-4">Valuation Certification</h2>
                      <p className="text-sm font-medium mb-12 px-8 leading-relaxed">
                        Having taken into consideration all relevant factors affecting value, it is our considered professional opinion that the Market Value of the property is:
                      </p>
                      <div className="p-12 border-4 border-slate-100 rounded-[2rem] mx-8 bg-slate-50 mb-16">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Total Market Value</p>
                        <h2 className="text-4xl font-black text-primary mb-4">GHS {selectedValuation.finalValue?.toLocaleString()}</h2>
                        
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-t pt-4 border-slate-200">Estimated Forced Sale Value</p>
                        <h2 className="text-2xl font-black text-slate-500">GHS {(selectedValuation.finalValue * 0.7)?.toLocaleString()}</h2>
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-[10px] mb-6">We certify that we have no present or prospective financial interest in the property evaluated.<br/>This report is valid solely for the stated purpose.</p>
                        <div className="w-48 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="font-black">{valuerDetails.name}</p>
                        <p className="text-slate-500 font-bold text-sm">{valuerDetails.firm}</p>
                      </div>
                    </div>
                    <div className="pdf-page-break" style={{ pageBreakAfter: 'always' }}></div>
                    
                    {/* APPENDICES */}
                    <div className="p-16 h-[297mm] flex flex-col relative border border-slate-50 mx-auto max-w-[210mm] shadow-sm pt-24 text-primary">
                      <h2 className="text-2xl font-black mb-12 text-center uppercase tracking-widest border-b pb-4">Appendices</h2>
                      <div className="space-y-8 text-sm">
                        <div>
                          <h4 className="font-black uppercase tracking-widest mb-2 border-l-4 border-accent pl-4">Appendix 1: Schedule of Accommodation</h4>
                          <p className="pl-5 text-slate-600">{valuerDetails.scheduleOfAccommodation || `Total Rooms: ${selectedValuation.subjectProperty?.rooms}`}</p>
                        </div>
                        <div>
                          <h4 className="font-black uppercase tracking-widest mb-2 border-l-4 border-accent pl-4">Appendix 2: Google Location Map</h4>
                          <p className="pl-5 text-slate-600">Coordinates: {selectedValuation.subjectProperty?.coordinates?.lat}, {selectedValuation.subjectProperty?.coordinates?.lng}</p>
                        </div>
                        <div>
                          <h4 className="font-black uppercase tracking-widest mb-2 border-l-4 border-accent pl-4">Appendix 3: Pictures & Sketch Plans</h4>
                          <p className="pl-5 text-slate-600">[Attachments included in main file packet]</p>
                        </div>
                      </div>
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
            margin: 0 !important;
            box-shadow: none !important;
          }
          .pdf-page-break { page-break-after: always; break-after: page; }
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
