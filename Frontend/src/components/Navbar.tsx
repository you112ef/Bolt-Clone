import { Bolt as BoltIcon } from 'lucide-react';
import React from 'react';
import { cn } from '../utils/cn';

interface NavbarProps {
  scrollY: number;
}

export function Navbar({ scrollY }: NavbarProps) {
  return (
    <nav
      className={cn(
        'fixed z-20 flex items-center justify-between p-6 transition-all duration-300 w-full',
        scrollY > 50
          ? 'backdrop-blur-lg bg-gray-950/70 shadow-lg shadow-black/10'
          : 'bg-transparent'
      )}
    >
      <div className="w-full flex items-center justify-between px-8 left-0 right-0">
        <div className="flex items-center space-x-2">
          <a href="#" className='flex items-center space-x-1'>
            <div className="relative w-10 h-10 flex items-center justify-center">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgMkwzIDEzTDEyIDEzTDExIDIyTDIxIDExTDEyIDExTDEzIDJaIiBzdHJva2U9IiM2MEE1RkEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiAvPjwvc3ZnPg==" 
              alt="Bolt Logo" 
              className="w-6 h-6 relative z-10" 
            />
            </div>
          <span className="text-2xl font-bold text-white">Bolt</span>
          </a>
        </div>
        <div className="flex items-center space-x-6">
          <a
            href="#features"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Features
          </a>
          <a
            href="#howitworks"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            FAQ
          </a>
        </div>
      </div>
    </nav>
  );
} 