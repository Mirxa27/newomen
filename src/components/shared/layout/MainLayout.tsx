import { ReactNode } from "react";
import Header from "./Header";
import MobileFooter from "./MobileFooter";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 footer-spacing">
        <div className="h-full overflow-x-hidden">
          {children}
        </div>
      </main>
      <MobileFooter />
    </div>
  );
}
