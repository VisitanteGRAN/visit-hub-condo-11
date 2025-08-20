import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 md:h-16 flex items-center justify-between border-b border-border bg-card px-3 md:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <SidebarTrigger className="flex-shrink-0 md:hidden" />
              {title && (
                <h1 className="font-semibold text-base md:text-lg text-foreground truncate">
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground min-w-0">
              {isMobile ? (
                <span className="truncate max-w-[120px]">{user?.name}</span>
              ) : (
                <span className="truncate">Bem-vindo, {user?.name}</span>
              )}
            </div>
          </header>
          
          <div className="flex-1 p-3 md:p-4 lg:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}