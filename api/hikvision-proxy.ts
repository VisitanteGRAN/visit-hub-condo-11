// Configurações do HikCentral
const HIKCENTRAL_CONFIG = {
  baseUrl: 'http://192.168.1.200:3389',
  username: 'luca',
  password: 'Luca123#',
  timeout: 30000
};

export default async function handler(req: any, res: any) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const { action, data } = req.body || {};

    if (!action) {
      return res.status(400).json({ success: false, error: 'Ação não especificada' });
    }

    // Teste simples de conectividade
    if (action === 'test') {
      try {
        const response = await fetch(`${HIKCENTRAL_CONFIG.baseUrl}/api/system/v2/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: HIKCENTRAL_CONFIG.username,
            password: HIKCENTRAL_CONFIG.password
          })
        });

        return res.status(200).json({
          success: response.ok,
          status: response.status,
          statusText: response.statusText
        });
      } catch (error: any) {
        return res.status(200).json({
          success: false,
          error: error.message
        });
      }
    }

    // Para outras ações, retornar erro por enquanto
    return res.status(400).json({ 
      success: false, 
      error: 'Ação não implementada ainda',
      message: 'Proxy em manutenção - usando fallback'
    });

  } catch (error: any) {
    console.error('❌ Erro no proxy handler:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
} 