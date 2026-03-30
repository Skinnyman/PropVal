import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Settings,
  LogOut,
  Search,
  ShieldAlert,
  Menu,
  X,
  Map as MapIcon,
  BarChart3,
  ChevronDown,
  ChevronUp,
  HardHat,
  Box,
  Wrench,
  Percent,
  Map,
  Home,
  Upload
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';


const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [dataBankOpen, setDataBankOpen] = useState(false);
  const dataCategories = [
    { id: 'Market Overview', label: 'Market Overview', icon: 'BarChart3' },
    { id: 'Sale Transactions', label: 'Sale Transactions', icon: 'FileText' },
    { id: 'Rental Evidence', label: 'Rental Evidence', icon: 'Home' },
    { id: 'Construction Costs', label: 'Construction Costs', icon: 'HardHat' },
    { id: 'Building Materials', label: 'Building Materials', icon: 'Box' },
    { id: 'Cap Rates / Yields', label: 'Cap Rates / Yields', icon: 'Percent' },
    { id: 'Land Values', label: 'Land Values', icon: 'Map' }
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleDataBank = (e) => {
    e.preventDefault();
    setDataBankOpen(!dataBankOpen);
  };

  const getIcon = (iconName) => {
    const iconMap = {
      BarChart3, HardHat, Box, Wrench, Percent, Map, Home
    };
    return iconMap[iconName] || BarChart3;
  };

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['Valuer', 'Admin'] },
    { icon: Calculator, label: 'Valuation Calculator', path: '/valuation', roles: ['Valuer', 'Admin'] },
    { icon: Search, label: 'Property Database', path: '/properties', roles: ['Valuer', 'Admin'] },
    { icon: MapIcon, label: 'Property Map', path: '/map', roles: ['Valuer', 'Admin'] },
    {
      icon: BarChart3,
      label: 'Data Bank',
      path: '/databank',
      roles: ['Valuer', 'Admin'],
      hasChildren: true,
      children: dataCategories.map(cat => ({
        label: cat.label,
        icon: getIcon(cat.icon),
        category: cat.id
      }))
    },
    { icon: FileText, label: 'Report Generator', path: '/reports', roles: ['Valuer', 'Admin'] },
    { icon: ShieldAlert, label: 'Admin Portal', path: '/admin', roles: ['Admin'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['Valuer', 'Admin'] },
  ];

  const menuItems = allMenuItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-[60] p-3 bg-primary text-white rounded-2xl shadow-2xl shadow-slate-900/20 active:scale-95 transition-transform"
      >
        <Menu size={20} />
      </button>

      {/* Screen Overlay for Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed md:relative top-0 left-0 w-64 h-[100dvh] bg-primary text-slate-300 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
              <Calculator size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">PropVal GH</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.path}>
              {item.hasChildren ? (
                <>
                  <button
                    onClick={toggleDataBank}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 hover:bg-slate-800 hover:text-white group"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon size={20} className="text-slate-400 group-hover:text-white" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {dataBankOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {dataBankOpen && (
                    <div className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.category}
                          to={`${item.path}?category=${encodeURIComponent(child.category)}`}
                          onClick={() => setIsOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2 text-xs rounded-lg transition duration-200 ${isActive ? 'bg-accent/20 text-accent font-bold' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                            }`
                          }
                        >
                          <child.icon size={14} />
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 ${isActive ? 'bg-accent text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-4 py-4 mb-2">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{user?.role || 'Valuer'}</p>
            </div>
          </div>
          <NavLink
            to="/databank?category=Upload Data"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 ${isActive ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`
            }
          >
            <Upload size={20} />
            <span className="font-medium">Upload Data</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 hover:text-red-400 transition text-slate-400"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
