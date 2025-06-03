import { cn } from '../utils/cn';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  scrollY: number;
}

export function Navbar({ scrollY }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ filter: 'blur(10px)' }}
        animate={{ filter: 'blur(0px)' }}
        transition={{ duration: 0.3 }}
        className={cn(
          'fixed z-20 flex items-center justify-between py-6 md:p-6 transition-all duration-300 w-full',
          scrollY > 50
            ? 'backdrop-blur-lg bg-gray-950/70 shadow-lg shadow-black/10'
            : 'bg-transparent'
        )}
      >
        <div className="w-full flex items-center justify-between md:px-8 px-3 left-0 right-0">
          <div className="flex items-center space-x-2">
            <div
              onClick={() => (window.location.href = '/')}
              className="flex items-center space-x-1 cursor-pointer"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgMkwzIDEzTDEyIDEzTDExIDIyTDIxIDExTDEyIDExTDEzIDJaIiBzdHJva2U9IiM2MEE1RkEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiAvPjwvc3ZnPg=="
                  alt="Bolt Logo"
                  className="w-6 h-6 relative z-10"
                />
              </div>
              <span className="text-2xl font-bold text-white">Bolt</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
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
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>
      {/* Mobile menu */}
      <div
        className={`${
          menuOpen
            ? "absolute top-16 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-md shadow-xl flex flex-col items-center space-y-4 py-4 md:hidden"
            : "hidden"
        }`}
      >
        <a
          href="#features"
          className="text-gray-300 hover:text-white transition-colors text-lg py-2"
          onClick={() => setMenuOpen(false)}
        >
          Features
        </a>
        <a
          href="#howitworks"
          className="text-gray-300 hover:text-white transition-colors text-lg py-2"
          onClick={() => setMenuOpen(false)}
        >
          How it works
        </a>
        <a
          href="#faq"
          className="text-gray-300 hover:text-white transition-colors text-lg py-2"
          onClick={() => setMenuOpen(false)}
        >
          FAQ
        </a>
      </div>
    </>
  );
}
