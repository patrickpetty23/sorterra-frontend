import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Settings, FolderOpen } from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Recipes', href: '/recipes', icon: ClipboardList },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-sidebar-light">
          <FolderOpen className="w-8 h-8 text-primary-400 mr-3" />
          <h1 className="text-2xl font-bold text-white">Sorterra</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-sidebar-light text-white'
                    : 'text-gray-300 hover:bg-sidebar-light hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Connected Organization Badge */}
        <div className="px-4 py-4 border-t border-sidebar-light">
          <div className="flex items-center px-4 py-3 bg-sidebar-light rounded-lg">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
              CC
            </div>
            <div>
              <p className="text-white font-medium text-sm">CenCore Legal</p>
              <p className="text-gray-400 text-xs">Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
