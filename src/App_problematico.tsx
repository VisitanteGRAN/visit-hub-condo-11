import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import MeusVisitantes from "./pages/MeusVisitantes";
import NovoVisitante from "./pages/NovoVisitante";
import CadastroVisitante from "./pages/CadastroVisitante";
import CadastroMorador from "./pages/CadastroMorador";
import CadastroSucesso from "./pages/CadastroSucesso";
import GestaoVisitantes from "./pages/GestaoVisitantes";
import NotFound from "./pages/NotFound";
import ConfiguracaoHikvision from "./pages/ConfiguracaoHikvision";
import TesteHikvision from "./pages/TesteHikvision";
import TesteScraping from "./pages/TesteScraping";

const App = () => {
  return (
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
              <Route path="/visitante/:linkId" element={<CadastroVisitante />} />
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
                path="/gestao-visitantes" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <GestaoVisitantes />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
