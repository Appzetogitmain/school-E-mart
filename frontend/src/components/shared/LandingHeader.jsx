import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About Us', path: ROUTES.ABOUT },
    { name: 'How It Works', path: ROUTES.HOW_IT_WORKS },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-white/95 backdrop-blur-sm py-5'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <img src="/assets/logo.jpeg" alt="School E-Mart" className="h-10 w-auto rounded-lg" />
            <span className="text-xl font-medium text-primary tracking-tight hidden sm:block">
              School E-Mart
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className="text-[15px] font-normal text-text-primary hover:text-primary transition-colors"
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate(`${ROUTES.MARKETPLACE}?role=school`)}
              className="px-6 py-2.5 text-primary font-normal border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-300"
            >
              For Schools
            </button>
            <button
              onClick={() => navigate(`${ROUTES.MARKETPLACE}?role=parent`)}
              className="px-6 py-2.5 bg-golden-yellow text-deep-purple font-normal rounded-full hover:bg-accent-gold shadow-md hover:shadow-lg transition-all duration-300"
            >
              For Parents
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-primary"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-text-primary"
              >
                {link.name}
              </NavLink>
            ))}
            <hr className="border-gray-100" />
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { navigate(`${ROUTES.MARKETPLACE}?role=school`); setIsMobileMenuOpen(false); }}
                className="w-full py-3 text-primary font-normal border-2 border-primary rounded-xl"
              >
                For Schools
              </button>
              <button
                onClick={() => { navigate(`${ROUTES.MARKETPLACE}?role=parent`); setIsMobileMenuOpen(false); }}
                className="w-full py-3 bg-golden-yellow text-deep-purple font-normal rounded-xl shadow-md"
              >
                For Parents
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
