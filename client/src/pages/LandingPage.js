import React from 'react';
import { Link } from 'react-router-dom';
import { Home, BarChart3, Map as MapIcon, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Home className="text-accent w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight text-primary">PropVal GH</span>
        </div>
        <div className="hidden md:flex space-x-8 text-secondary font-medium">
          <a href="#features" className="hover:text-accent transition">Features</a>
          <a href="#pricing" className="hover:text-accent transition">Pricing</a>
          <Link to="/properties" className="hover:text-accent transition">Market Data</Link>
        </div>
        <div className="flex space-x-4">
          <Link to="/login" className="px-5 py-2 text-accent font-semibold hover:bg-blue-50 transition rounded-lg">Login</Link>
          <Link to="/register" className="px-5 py-2 bg-accent text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-200 transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-3xl md:text-7xl font-extrabold mb-8 leading-tight">
              Ghana's Premium <span className="text-accent">Property Intelligence</span> Platform
            </h1>
            <p className="text-lg md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Empowering professional valuers, banks, and developers with real-time property data and automated valuation tools.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/dashboard" className="px-8 py-4 bg-accent text-white text-lg font-bold rounded-xl hover:scale-105 transition transform">Access Dashboard</Link>
              <button className="px-8 py-4 bg-white/10 text-white text-lg font-bold rounded-xl border border-white/20 hover:bg-white/20 transition">View Demo</button>
            </div>
          </div>
        </div>
        {/* Abstract shapes/background effects could go here */}
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Core Platform Features</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Everything you need to perform accurate property valuations in one unified workspace.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50/50 hover:border-accent/30 transition group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition">
                <BarChart3 size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Vast Property Database</h3>
              <p className="text-slate-600 leading-relaxed">Access verified transaction data from across all major regions in Ghana, searchable and filterable by diverse metrics.</p>
            </div>
            <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50/50 hover:border-accent/30 transition group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition">
                <MapIcon size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Interactive Mapping</h3>
              <p className="text-slate-600 leading-relaxed">Visualize market trends and property clusters with our advanced Mapbox integration and geospatial analysis tools.</p>
            </div>
            <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50/50 hover:border-accent/30 transition group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Professional Reports</h3>
              <p className="text-slate-600 leading-relaxed">Generate detailed PDF valuation reports instantly, complete with comparable tables and adjustment calculations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-accent overflow-hidden relative">
        <div className="container mx-auto px-6 text-center relative z-10 text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your valuation workflow?</h2>
          <p className="text-xl mb-10 opacity-90 max-w-xl mx-auto">Join hundreds of professionals in Ghana using PropVal GH for smarter property decisions.</p>
          <Link to="/register" className="px-10 py-4 bg-white text-accent text-lg font-bold rounded-xl hover:shadow-2xl transition shadow-xl">Create Free Account</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 text-white mb-6">
              <Home className="text-accent w-6 h-6" />
              <span className="text-xl font-bold tracking-tight">PropVal GH</span>
            </div>
            <p className="max-w-xs">The ultimate intelligence platform for the Ghana real estate market. Data driven, valuer focused.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Product</h4>
            <ul className="space-y-4">
              <li><a href="/#features" className="hover:text-white transition">Features</a></li>
              <li><a href="/#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><a href="/#databases" className="hover:text-white transition">Databases</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-4">
              <li><a href="/#about" className="hover:text-white transition">About Us</a></li>
              <li><a href="/#contact" className="hover:text-white transition">Contact</a></li>
              <li><a href="/#docs" className="hover:text-white transition">Documentation</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-12 pt-12 border-t border-slate-800 text-center text-sm">
          &copy; {new Date().getFullYear()} PropVal GH. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
