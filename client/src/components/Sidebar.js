import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Settings,
  LogOut,
  CreditCard,
  Search,
  ShieldAlert,
  PlusSquare,
  Menu,
  X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['Valuer', 'Admin'] },
    { icon: Search, label: 'Explorer', path: '/properties', roles: ['Valuer', 'Admin'] },
    { icon: PlusSquare, label: 'Contribute Data', path: '/submit-property', roles: ['Valuer', 'Admin'] },
    { icon: ShieldAlert, label: 'Admin Portal', path: '/admin', roles: ['Admin'] },
    { icon: FileText, label: 'Valuation', path: '/valuation', roles: ['Valuer'] },
    { icon: FileText, label: 'Reports', path: '/reports', roles: ['Valuer'] },
    { icon: CreditCard, label: 'Subscription', path: '/subscription', roles: ['Valuer'] },
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <Menu size={24} />
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
            <NavLink
              key={item.path}
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
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
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
