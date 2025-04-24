import React, { ReactNode } from 'react';
import { BoltIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Loader } from '../components/Loader';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { loading } = useAppContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white">
      {loading && <Loader />}
      
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
            <BoltIcon className="w-5 h-5 text-white relative z-10" />
          </div>
          <span className="text-xl font-bold text-white">Bolt</span>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="border-t border-gray-800 px-6 py-4 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Bolt. All rights reserved.</p>
      </footer>
    </div>
  );
}; 