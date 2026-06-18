import { useEffect } from 'react';
import { useLocation } from 'react-router';
import NavigationBar from './NavigationBar';
import Footer from './Footer';
import CustomCursor from './CustomCursor';
import { useLenis } from '@/hooks/useLenis';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export default function Layout({ children, showFooter = true }: LayoutProps) {
  const location = useLocation();
  useLenis();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <CustomCursor />
      <NavigationBar />
      {children}
      {showFooter && <Footer />}
    </>
  );
}
