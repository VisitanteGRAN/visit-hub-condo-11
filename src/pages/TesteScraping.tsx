import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { hikCentralScrapingService } from '@/services/hikCentralScrapingService';
import { logger } from '@/utils/secureLogger';

export default function TesteScraping() {
  const [hikCentralUrl, setHikCentralUrl] = useState('http://192.168.1.200:3389');
  const [username, setUsername] = useState('luca');
  const [password, setPassword] = useState('Luca123#');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [structureResult, setStructureResult] = useState<any>(null);
  const [flowResult, setFlowResult] = useState<any>(null);

  const updateLogs = () => {
    setLogs([...hikCentralScrapingService.getLogs()]);
  };

  const initializeService = async () => {
    setLoading(true);
    try {
      // Configurar serviço
      hikCentralScrapingService.setHikCentralUrl(hikCentralUrl);
      hikCentralScrapingService.setCredentials(username, password);
      
      // Inicializar
      const result = await hikCentralScrapingService.initialize();
      updateLogs();
      
      if (result) {
        setTestResult({ success: true, message: 'Serviço inicializado com sucesso' });
      } else {
        setTestResult({ success: false, message: 'Falha ao inicializar serviço' });
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      setTestResult({ success: false, message: `Erro: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await hikCentralScrapingService.testConnection();
      updateLogs();
      setTestResult(result);
    } catch (error) {
      console.error('Erro no teste:', error);
      setTestResult({ success: false, message: `Erro: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const discoverStructure = async () => {
    setLoading(true);
    try {
      const result = await hikCentralScrapingService.discoverPageStructure();
      updateLogs();
      setStructureResult(result);
    } catch (error) {
      console.error('Erro na descoberta:', error);
      setStructureResult({ success: false, message: `Erro: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const testCompleteFlow = async () => {
    setLoading(true);
    try {
      const result = await hikCentralScrapingService.testCompleteFlow();
      updateLogs();
      setFlowResult(result);
    } catch (error) {
      console.error('Erro no teste do fluxo:', error);
      setFlowResult({ success: false, message: `Erro: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    hikCentralScrapingService.clearLogs();
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🤖 Teste Scraping HikCentral</h1>
        <Badge>Automação Web</Badge>
      </div>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Configuração do HikCentral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="url">URL do HikCentral</Label>
              <Input
                id="url"
                value={hikCentralUrl}
                onChange={(e) => setHikCentralUrl(e.target.value)}
                placeholder="http://192.168.1.200:3389"
              />
            </div>
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="luca"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Luca123#"
              />
            </div>
          </div>
          
          <Button 
            onClick={initializeService} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Inicializando...' : '🔧 Inicializar Serviço'}
          </Button>
        </CardContent>
      </Card>

      {/* Testes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Teste de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Teste de Conexão
              <Button 
                onClick={testConnection} 
                disabled={loading}
                className="text-xs px-2 py-1"
              >
                {loading ? 'Testando...' : 'Testar'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult && (
              <div className={`p-3 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  {testResult.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Descoberta de Estrutura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧬 Descoberta de Estrutura
              <Button 
                onClick={discoverStructure} 
                disabled={loading}
                className="text-xs px-2 py-1"
              >
                {loading ? 'Analisando...' : 'Analisar'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {structureResult && (
              <div className={`p-3 rounded-lg ${
                structureResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={structureResult.success ? 'text-green-800' : 'text-red-800'}>
                  {structureResult.message}
                </p>
                {structureResult.structure && (
                  <div className="mt-2 text-sm">
                    <p><strong>Título:</strong> {structureResult.structure.title}</p>
                    <p><strong>Formulários:</strong> {structureResult.structure.forms?.length || 0}</p>
                    <p><strong>Campos:</strong> {structureResult.structure.inputs?.length || 0}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teste do Fluxo Completo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Teste do Fluxo Completo
              <Button 
                onClick={testCompleteFlow} 
                disabled={loading}
                className="text-xs px-2 py-1"
              >
                {loading ? 'Executando...' : 'Executar'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flowResult && (
              <div className={`p-3 rounded-lg ${
                flowResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={flowResult.success ? 'text-green-800' : 'text-red-800'}>
                  {flowResult.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            📋 Logs do Sistema
            <Button onClick={clearLogs} className="text-xs px-2 py-1">
              Limpar Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Nenhum log disponível. Execute um teste para ver os logs.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Como Funciona o Scraping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🤖 O que é Scraping?</h4>
            <p className="text-sm text-blue-800">
              Scraping é uma técnica onde um "robô" (bot) simula ações humanas em uma interface web:
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
              <li>Navega pelas páginas automaticamente</li>
              <li>Preenche formulários como se fosse uma pessoa</li>
              <li>Faz upload de arquivos</li>
              <li>Clica em botões e links</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">✅ Vantagens</h4>
            <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
              <li><strong>Sem APIs:</strong> Usa a interface web existente</li>
              <li><strong>Sem configurações:</strong> Funciona com qualquer versão</li>
              <li><strong>Automação total:</strong> Processo 100% automático</li>
              <li><strong>Upload de fotos:</strong> Simula seleção de arquivos</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">⚠️ Para Funcionar Realmente</h4>
            <p className="text-sm text-yellow-800">
              Instale o Puppeteer para scraping real:
            </p>
            <code className="block bg-yellow-100 p-2 rounded mt-2 text-sm">
              npm install puppeteer
            </code>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎯 Fluxo Identificado</h4>
            <p className="text-sm text-purple-800">
              Baseado nas suas telas, o bot irá:
            </p>
            <ol className="text-sm text-purple-700 mt-2 list-decimal list-inside space-y-1">
              <li><strong>Clicar nos 4 quadrados</strong> (menu principal)</li>
              <li><strong>Selecionar "Entrada de visitante"</strong></li>
              <li><strong>Escolher "Entrada de visitante não reservada"</strong></li>
              <li><strong>Preencher formulário:</strong>
                <ul className="ml-4 mt-1 list-disc list-inside">
                  <li>Nome próprio e apelido</li>
                  <li><strong>Visitado: Selecionar morador vinculado</strong></li>
                  <li><strong>Grupo: "VisitanteS"</strong></li>
                  <li>RG, telefone, e-mail</li>
                </ul>
              </li>
              <li><strong>Clicar em "Entrada"</strong></li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 