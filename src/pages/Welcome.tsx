import { Button } from '@/components/ui/button';
import { Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import PWAInstallInstructions from '@/components/PWAInstallInstructions';
import logoCondominio from '@/assets/logo-condominio.png';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <header className="relative p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary">
          <Building2 className="h-6 w-6" />
          <h1 className="text-xl font-bold">Gran Royalle</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Hero Title */}
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Bem-vindo
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Acesse o portal de gestão de visitantes do condomínio
            </p>
          </div>

          {/* Access Button */}
          <div className="pt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-12 py-6 rounded-full group hover:scale-105 transition-all duration-300 shadow-button"
            >
              <Link to="/login" className="flex items-center gap-3">
                Acessar Portal
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </div>

          {/* Subtle Info */}
          <div className="pt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p>Sistema exclusivo para moradores e administração</p>
          </div>
        </div>

        {/* PWA Install Instructions */}
        <div className="w-full px-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <PWAInstallInstructions />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative p-6 text-center text-sm text-muted-foreground">
        <p>© 2024 Gran Royalle - Sistema de Visitantes</p>
      </footer>
    </div>
  );
}