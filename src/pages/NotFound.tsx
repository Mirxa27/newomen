import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="app-page-shell flex min-h-screen items-center justify-center p-6">
      <div className="glass-card max-w-md w-full text-center space-y-4">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="clay-button inline-flex items-center justify-center">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
