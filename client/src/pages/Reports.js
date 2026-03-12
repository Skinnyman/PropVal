import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { FileText, Download, Eye, Clock } from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchValuations = async () => {
      try {
        const res = await api.get('/valuations');
        setReports(res.data);
      } catch (err) {
        console.error('Error fetching valuations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchValuations();
  }, []);

  const downloadReport = async (id) => {
    try {
      const response = await api.get(`/valuations/${id}/report`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `valuation-${id}.pdf`);
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
        <header className="bg-white border-b px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-2xl font-bold text-primary">Valuation Reports</h1>
        </header>

        <div className="p-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-lg">Past Reports</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{reports.length} Generated</span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report._id} className="p-6 hover:bg-slate-50 transition flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-50 text-accent rounded-xl flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">{report.subjectProperty?.suburb || 'N/A'}, {report.subjectProperty?.region || 'N/A'}</h4>
                        <p className="text-xs text-slate-500 flex items-center">
                          <Clock size={12} className="mr-1" /> {new Date(report.createdAt).toLocaleDateString()} • {report._id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right mr-6">
                        <p className="font-black text-primary">GHS {report.finalValue?.toLocaleString()}</p>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-accent transition">
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={() => downloadReport(report._id)}
                        className="p-2 text-slate-400 hover:text-accent transition"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-bold">No reports generated yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
