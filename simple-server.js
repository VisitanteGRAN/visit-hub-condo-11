const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`Requisição: ${req.method} ${req.url}`);
  
  if (req.url === '/') {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Teste Simples</title>
</head>
<body>
    <h1>🏠 Visit Hub Condo</h1>
    <p>Sistema de Gestão de Visitantes</p>
    <button onclick="alert('🎉 Funcionando!')">Testar Sistema</button>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Página não encontrada');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Diretório: ${__dirname}`);
}); 