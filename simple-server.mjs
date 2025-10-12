import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Servir o index.html para rotas específicas (não use '*')
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota específica para a página de teste
app.get('/pwa-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pwa-tester.html'));
});

// Iniciar o servidor na porta 8000 (diferente do Vite)
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`✅ Para acessar na rede local: http://192.168.15.11:${PORT}`);
  console.log(`✅ Teste de PWA disponível em: http://localhost:${PORT}/pwa-tester.html`);
});