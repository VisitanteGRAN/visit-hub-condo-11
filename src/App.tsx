import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import MeusVisitantes from "./pages/MeusVisitantes";
import NovoVisitante from "./pages/NovoVisitante";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meus-visitantes" 
              element={
                <ProtectedRoute requiredRole="morador">
                  <MeusVisitantes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/novo-visitante" 
              element={
                <ProtectedRoute requiredRole="morador">
                  <NovoVisitante />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notificacoes" 
              element={
                <ProtectedRoute>
                  <div>Notificações em desenvolvimento</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/configuracoes" 
              element={
                <ProtectedRoute>
                  <div>Configurações em desenvolvimento</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gestao-visitantes" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Gestão de Visitantes em desenvolvimento</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/relatorios" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Relatórios em desenvolvimento</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gestao-usuarios" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Gestão de Usuários em desenvolvimento</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notificacoes-sistema" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Notificações do Sistema em desenvolvimento</div>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
