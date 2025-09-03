import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  Bell, 
  Settings, 
  BarChart3, 
  UserCog,
  LogOut,
  Home
} from 'lucide-react';
import logoCondominio from '@/assets/logo-condominio.png';
import { useIsMobile } from '@/hooks/use-mobile';

const moradorItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Meus Visitantes', url: '/meus-visitantes', icon: Users },
  { title: 'Novo Visitante', url: '/novo-visitante', icon: UserPlus },
  { title: 'Notificações', url: '/notificacoes', icon: Bell },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

const adminItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Gestão de Visitantes', url: '/gestao-visitantes', icon: Users },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Gestão de Usuários', url: '/gestao-usuarios', icon: UserCog },
  { title: 'Notificações do Sistema', url: '/notificacoes-sistema', icon: Bell },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;

  const items = user?.role === 'admin' ? adminItems : moradorItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <img 
            src={logoCondominio} 
            alt="Logo Gran Royalle" 
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm">Gran Royalle</span>
            <span className="text-xs text-muted-foreground font-medium">
              {user?.role === 'admin' ? 'Administrador' : 'Morador'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {user?.role === 'admin' ? 'Administração' : 'Meu Espaço'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      onClick={() => isMobile && setOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 w-full
                        ${isActive 
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                          : 'hover:bg-accent hover:text-accent-foreground'
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium text-sm">
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 mt-auto">
        <div className="space-y-3">
          {user && (
            <div className="px-3 py-3 bg-accent/50 rounded-lg border">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
              {user.apartamento && (
                <p className="text-xs text-muted-foreground truncate font-medium">Apto {user.apartamento}</p>
              )}
            </div>
          )}
          
          <Button 
            onClick={() => {
              logout();
              isMobile && setOpen(false);
            }}
            className="w-full justify-start gap-3 h-11 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}