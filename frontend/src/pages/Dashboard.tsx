import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Video, LifeBuoy, LogOut, Search } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import DashboardActions from '../components/DashboardActions'; // Your meeting card!

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    // This forces the background to fill the ENTIRE screen perfectly
    <div className="min-h-screen w-full bg-gray-50 flex overflow-hidden">
      
      {/* 1. The Fixed Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold mr-3">
              IM
            </div>
            <span className="text-xl font-bold text-gray-900">IntellMeet</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
              <LayoutDashboard size={18} /> Dashboard
            </a>
            <a href="/team" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
              <Users size={18} /> Team Workspace
            </a>
            <a href="/history" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
              <Video size={18} /> Meeting History
            </a>
          </nav>
        </div>

        {/* User Profile & Logout at the bottom of the sidebar */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || "Intern"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || "intern@zidio.com"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium transition"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. The Main Content Area (Fills the rest of the screen) */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96 hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
            <input 
              type="text" 
              placeholder="Search meetings, tasks, or teammates..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-700">
              <LifeBuoy size={20} />
            </button>
          </div>
        </header>

        {/* The Dashboard Body */}
        <div className="p-8 max-w-7xl mx-auto w-full">
          
          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || "User"}! 👋
            </h1>
            <p className="text-gray-500 mt-1">Ready to transform your meetings into actionable insights?</p>
          </div>

          {/* Core Feature: The Card we built previously! */}
          <DashboardActions />

          {/* Quick Stats (Placeholder to fill out the page beautifully) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Meetings Hosted</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Action Items Pending</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Hours Saved by AI</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">8.5h</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}