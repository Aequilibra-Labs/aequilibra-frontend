import { AppNavBar } from '@/components/app/AppNavBar';

// dApp shell layout with navbar and sidebar
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <AppNavBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
