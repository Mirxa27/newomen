import { ReactNode } from "react";
import Header from "./Header";
import MobileFooter from "./MobileFooter";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showMobileFooter?: boolean;
}

export default function MainLayout({ 
  children, 
  className = "",
  showHeader = true,
  showMobileFooter = true
}: MainLayoutProps) {
  return (
    <div className="app-page-shell">
      {/* Enhanced fixed background with better mobile support */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat bg-fixed" 
        style={{ backgroundImage: 'url(/fixed-background.jpg)' }}
      />
      
      {/* Enhanced glassmorphic overlay with improved gradients */}
      <div className="fixed inset-0 -z-9 bg-gradient-to-br from-black/80 via-purple-900/50 to-black/80 backdrop-blur-md" />
      
      {/* Animated background particles for visual enhancement */}
      <div className="fixed inset-0 -z-8 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Enhanced header with conditional rendering */}
      {showHeader && <Header />}
      
      {/* Enhanced main content area */}
      <main className={`
        flex-1 relative z-0 
        ${showMobileFooter ? 'footer-spacing' : ''} 
        ${showHeader ? 'pt-0' : 'pt-4'}
        ${className}
      `}>
        <div className="h-full overflow-x-hidden container-responsive">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
      
      {/* Enhanced mobile footer with conditional rendering */}
      {showMobileFooter && <MobileFooter />}
    </div>
  );
}
