import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const navLinks = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Nodes', href: '/#nodes' },
  { label: 'Impact', href: '/#impact' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Admin', href: '/admin' },
];

export default function NavigationBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 100,
      onUpdate: (self) => {
        setScrolled(self.scroll() > 100);
      },
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname, mobileOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const id = href.slice(2);
      if (location.pathname === '/') {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
          scrolled ? 'border-b border-[rgba(27,67,50,0.1)]' : ''
        }`}
        style={{
          backgroundColor: 'rgba(245, 241, 235, 0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-[1200px] mx-auto w-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-cursor-hover>
            <div className="w-4 h-4 rounded-full bg-[#52796F]" />
            <span className="font-display text-lg text-[#1B4332]">ReplenishFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="relative font-body font-medium text-sm text-[#2D3436] hover:text-[#52796F] transition-colors group"
                data-cursor-hover
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-[#52796F] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Link
            to="/dashboard"
            className="hidden md:inline-flex items-center px-5 py-2 rounded-full bg-[#52796F] text-white font-body font-medium text-sm hover:bg-[#3d5c54] transition-colors"
            data-cursor-hover
          >
            Get Started
          </Link>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMobileOpen(true)}
            data-cursor-hover
          >
            <span className="w-5 h-[2px] bg-[#2D3436]" />
            <span className="w-5 h-[2px] bg-[#2D3436]" />
            <span className="w-5 h-[2px] bg-[#2D3436]" />
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] bg-[#F5F1EB]">
          <div className="flex flex-col h-full p-6">
            <div className="flex justify-end">
              <button onClick={() => setMobileOpen(false)} className="p-2" data-cursor-hover>
                <X className="w-6 h-6 text-[#2D3436]" />
              </button>
            </div>
            <div className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="font-display text-3xl text-[#1B4332] hover:text-[#52796F] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#52796F] text-white font-body font-medium text-base mt-4"
                data-cursor-hover
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
