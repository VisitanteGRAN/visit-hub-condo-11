const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;

const server = http.createServer((req, res) => {
  console.log(`📡 Requisição: ${req.method} ${req.url}`);
  
  if (req.url === '/') {
    // Página principal
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visit Hub Condo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        .status {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.1em;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background: #0056b3;
        }
        .features {
            margin-top: 30px;
            text-align: left;
        }
        .features h3 {
            color: #333;
            margin-bottom: 15px;
        }
        .features ul {
            color: #666;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 Visit Hub Condo</h1>
        <p>Sistema de Gestão de Visitantes</p>
        
        <div class="status">
            ✅ <strong>Servidor funcionando perfeitamente!</strong><br>
            Porta: ${PORT} | Status: Online
        </div>
        
        <button onclick="testarSistema()">Testar Sistema</button>
        
        <div class="features">
            <h3>🚀 Funcionalidades:</h3>
            <ul>
                <li>Cadastro automático de visitantes</li>
                <li>Integração com HikCentral</li>
                <li>Validação de CPF</li>
                <li>Links únicos para convites</li>
                <li>Reconhecimento facial automático</li>
            </ul>
        </div>
    </div>

    <script>
        function testarSistema() {
            alert('🎉 Sistema funcionando perfeitamente!\\n\\nServidor: ✅\\nPorta: ${PORT}\\nStatus: Online');
        }
        
        // Log para debug
        console.log('🚀 Visit Hub Condo carregado com sucesso!');
        console.log('📡 Servidor rodando na porta:', ${PORT});
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    
  } else if (req.url === '/teste') {
    // Endpoint de teste da API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      message: 'API funcionando perfeitamente!',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
    
  } else {
    // 404 para outras rotas
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Página não encontrada</h1><p>Volte para <a href="/">página principal</a></p>');
  }
});

server.listen(PORT, () => {
  console.log('🚀 Servidor iniciado com sucesso!');
  console.log(`📡 Rodando em: http://localhost:${PORT}`);
  console.log(`📁 Diretório: ${__dirname}`);
  console.log(`⏰ Iniciado em: ${new Date().toLocaleString()}`);
  console.log('✅ Pronto para receber requisições!');
});

// Tratamento de erros
server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Servidor sendo encerrado...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso!');
    process.exit(0);
  });
}); 