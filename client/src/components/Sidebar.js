import React from 'react';
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
  PlusSquare
} from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);

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
    <aside className="w-64 bg-primary text-slate-300 flex flex-col min-h-screen">
      <div className="p-6 flex items-center space-x-2 text-white">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Calculator size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">PropVal GH</span>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
  );
};

export default Sidebar;
