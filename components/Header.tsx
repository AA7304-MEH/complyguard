import * as React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { User } from '../types';

interface HeaderProps {
    user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-900">ComplyGuard AI</h1>
          </div>
          <div className="flex items-center">
            <div className="text-right mr-4">
                <p className="text-sm font-medium text-gray-800">{user.email}</p>
                <p className="text-xs text-gray-500">{user.company_name}</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;