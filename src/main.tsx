import { createRoot } from 'react-dom/client'

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
