import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Building2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header simples sem sidebar */}
      <header className="border-b bg-white dark:bg-card">
        <div className="flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-6 w-6" />
              <h1 className="text-xl font-bold">Gran Royalle</h1>
            </div>
            {title && (
              <div className="hidden md:block">
                <span className="text-muted-foreground mx-2">•</span>
                <span className="font-medium">{title}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">
              Bem-vindo, {user?.name}
            </span>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
        
      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}