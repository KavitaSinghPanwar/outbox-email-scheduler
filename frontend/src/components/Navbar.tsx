import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, LogOut, Plus, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onOpenCompose: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCompose }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">Outbox</h1>
            <span className="text-xs font-medium text-slate-500">Email Job Scheduler</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCompose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            Schedule Email
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">{user.email}</span>
            </div>
          )}

          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
