import { createRoot } from 'react-dom/client'

// 🧪 TESTE DIRETO DAS VARIÁVEIS (TEMPORÁRIO)
console.log('=== TESTE VARIÁVEIS ENV (MAIN.TSX) ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'PRESENTE ✅' : 'FALTANDO ❌');
console.log('VITE_SUPABASE_SERVICE_KEY:', import.meta.env.VITE_SUPABASE_SERVICE_KEY ? 'PRESENTE ✅' : 'FALTANDO ❌');
console.log('Todas as variáveis ENV:', import.meta.env);

// 🔐 Inicializar utilitários de segurança
import './utils/securityHeaders'
import envValidator from './utils/envValidator'
import { logger } from './utils/secureLogger'

import App from './App.tsx'
import './index.css'

// Validar configuração antes de iniciar app
try {
  const config = envValidator.getConfig();
  logger.info('🔐 Sistema iniciado com configuração segura', {
    env: config.nodeEnv,
    secure: config.isSecure
  });
} catch (error) {
  logger.error('🚨 ERRO CRÍTICO DE CONFIGURAÇÃO', { error });
  throw error;
}

createRoot(document.getElementById("root")!).render(<App />);
