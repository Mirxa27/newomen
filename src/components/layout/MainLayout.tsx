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
      <main className="flex-1 pt-16 pb-20 md:pb-4">
        <div className="h-full overflow-x-hidden">
          {children}
        </div>
      </main>
      <MobileFooter />
    </div>
  );
}
