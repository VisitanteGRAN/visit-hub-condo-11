import { VercelRequest, VercelResponse } from '@vercel/node';

// Handler simples para o Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Health check
  if (req.url === '/api/health') {
    return res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'Visit Hub Condo API funcionando!'
    });
  }

  // Rota padrão da API
  if (req.url?.startsWith('/api/')) {
    return res.json({ 
      message: 'Visit Hub Condo API',
      endpoints: [
        '/api/health',
        '/api/visitantes',
        '/api/auth',
        '/api/admin'
      ]
    });
  }

  // Para outras rotas, retorna 404
  res.status(404).json({ error: 'Rota não encontrada' });
} 