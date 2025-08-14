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
  Building2,
  LogOut,
  Home
} from 'lucide-react';
import logoCondominio from '@/assets/logo-condominio.png';

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
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const items = user?.role === 'admin' ? adminItems : moradorItems;
  const collapsed = state === 'collapsed';
  
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary text-primary-foreground font-medium' 
      : 'text-foreground hover:bg-accent hover:text-accent-foreground';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <img 
            src={logoCondominio} 
            alt="Logo Gran Royalle" 
            className="h-10 w-auto object-contain"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-foreground">Gran Royalle</span>
              <span className="text-xs text-muted-foreground">
                {user?.role === 'admin' ? 'Administrador' : 'Morador'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {user?.role === 'admin' ? 'Administração' : 'Meu Espaço'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-4 space-y-2">
          {!collapsed && user && (
            <div className="text-sm text-muted-foreground mb-2">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-xs">{user.email}</p>
              {user.apartamento && (
                <p className="text-xs">Apto {user.apartamento}</p>
              )}
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={logout}
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}