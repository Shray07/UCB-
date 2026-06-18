import { Link } from 'react-router';

const footerLinks = {
  Product: [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Node Explorer', href: '/#nodes' },
    { label: 'Impact Metrics', href: '/#impact' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'KNIME Integration', href: '#' },
    { label: 'API Reference', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Privacy', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#1B4332] text-white">
      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-[#52796F]" />
              <span className="font-display text-lg">ReplenishFlow</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Intelligent inventory automation powered by KNIME.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-body font-semibold text-sm mb-4">{title}</h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-white/70 text-sm hover:text-white transition-colors"
                      data-cursor-hover
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-xs">
            &copy; {new Date().getFullYear()} ReplenishFlow. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-white/50 text-xs">Built with KNIME Analytics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
