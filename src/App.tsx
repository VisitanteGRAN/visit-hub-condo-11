import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import MeusVisitantes from "./pages/MeusVisitantes";
import NovoVisitante from "./pages/NovoVisitante";
import CadastroVisitanteSimplificado from "./pages/CadastroVisitanteSimplificado";
import CadastroMorador from "./pages/CadastroMorador";
import CadastroSucesso from "./pages/CadastroSucesso";
import GestaoVisitantes from "./pages/GestaoVisitantes";
import NotFound from "./pages/NotFound";
import ConfiguracaoHikvision from "./pages/ConfiguracaoHikvision";
import TesteHikvision from "./pages/TesteHikvision";
import TesteScraping from "./pages/TesteScraping";
import AdminApprovals from "./pages/AdminApprovals";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro-morador" element={<CadastroMorador />} />
          <Route path="/cadastro-sucesso" element={<CadastroSucesso />} />
                        <Route path="/visitante/:linkId" element={<CadastroVisitanteSimplificado />} />
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
                <GestaoVisitantes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/relatorios" 
            element={
              <ProtectedRoute>
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
            path="/admin/approvals" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminApprovals />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/configuracao-hikvision" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ConfiguracaoHikvision />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teste-hikvision" 
            element={
              <ProtectedRoute requiredRole="admin">
                <TesteHikvision />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teste-scraping" 
            element={
              <ProtectedRoute requiredRole="admin">
                <TesteScraping />
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
);

export default App;
