import { ReactNode } from "react";
import Header from "./Header";
import MobileFooter from "./MobileFooter";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 pb-24 md:pb-4">
        {children}
      </main>
      <MobileFooter />
    </div>
  );
}
