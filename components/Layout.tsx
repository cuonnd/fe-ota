
import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, CubeIcon } from './common/Icons';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 p-6 space-y-6 fixed h-full shadow-lg">
        <div className="flex items-center space-x-3">
          <CubeIcon className="h-10 w-10 text-sky-400" />
          <h1 className="text-2xl font-bold text-sky-400">AppRelease</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 text-slate-300 hover:bg-slate-700 hover:text-sky-400 p-3 rounded-lg transition-colors duration-200"
              >
                <HomeIcon className="h-6 w-6" />
                <span>Dashboard</span>
              </Link>
            </li>
            {/* Add more navigation links here if needed */}
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col ml-64">
        <header className="bg-slate-800 shadow-md p-6 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-slate-200">Application Release Hub</h2>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
