import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { hikCentralService } from '@/services/hikvisionService';
import { Loader2, Wifi, WifiOff, CheckCircle, XCircle, Server, Camera, Shield } from 'lucide-react';

export default function TesteHikCentral() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🔍 Testando conexão com HikCentral...');
      const result = await hikCentralService.testConnection();

      if (result.success) {
        setTestResult(result);
        console.log('✅ Teste bem-sucedido:', result);
      } else {
        setError(result.message);
        console.error('❌ Teste falhou:', result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('💥 Erro no teste:', err);
    } finally {
      setIsTesting(false);
    }
  };

  const testSystemInfo = async () => {
    try {
      console.log('🔍 Obtendo informações do sistema...');
      const systemInfo = await hikCentralService.getSystemInfo();
      console.log('📱 Informações do sistema:', systemInfo);

      if (testResult) {
        setTestResult({
          ...testResult,
          systemInfo
        });
      }
    } catch (err) {
      console.error('❌ Erro ao obter informações do sistema:', err);
    }
  };

  const testNetworkInfo = async () => {
    try {
      console.log('🔍 Obtendo informações de rede...');
      const networkInfo = await hikCentralService.getNetworkInfo();
      console.log('🌐 Informações de rede:', networkInfo);
    } catch (err) {
      console.error('❌ Erro ao obter informações de rede:', err);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Server className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Teste de Conexão HikCentral</h1>
          <p className="text-muted-foreground">
            Teste a conectividade com o servidor HikCentral
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            Configuração do Servidor
          </CardTitle>
          <CardDescription>
            Detalhes da conexão com o servidor HikCentral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">IP do Servidor</label>
              <p className="text-lg font-mono bg-muted p-2 rounded">45.4.132.189:3389</p>
            </div>
            <div>
              <label className="text-sm font-medium">Usuário</label>
              <p className="text-lg font-mono bg-muted p-2 rounded">luca</p>
            </div>
          </div>

          <Button
            onClick={testConnection}
            disabled={isTesting}
            className="w-full"
            size="lg"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando Conexão...
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                Testar Conexão
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              Conexão Bem-sucedida!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-green-700 dark:text-green-300">{testResult.message}</p>

            {testResult.details && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Dispositivos encontrados: {testResult.details.devicesCount}</span>
                </div>

                <Button
                  onClick={testSystemInfo}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Obter Detalhes do Sistema
                </Button>
              </div>
            )}

            {testResult.systemInfo && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Informações do Sistema:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult.systemInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <XCircle className="h-5 w-5" />
              Erro na Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{error}</p>

            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-red-800 dark:text-red-200">Possíveis causas:</h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Servidor HikCentral não está acessível na rede</li>
                <li>• Credenciais incorretas</li>
                <li>• Porta 3389 bloqueada pelo firewall</li>
                <li>• Servidor HikCentral não está rodando</li>
                <li>• Endpoints da API podem ser diferentes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Testes Adicionais</CardTitle>
            <CardDescription>
              Teste funcionalidades específicas do sistema HikCentral
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={testSystemInfo}
                variant="outline"
                className="h-20 flex-col"
              >
                <Server className="h-6 w-6 mb-2" />
                Informações do Sistema
              </Button>

              <Button
                onClick={testNetworkInfo}
                variant="outline"
                className="h-20 flex-col"
              >
                <Wifi className="h-6 w-6 mb-2" />
                Informações de Rede
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona a Integração</CardTitle>
          <CardDescription>
            Fluxo de cadastro e integração com HikCentral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">🔗 Fluxo de Integração:</h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Morador cria convite único no nosso sistema</li>
              <li>Visitante preenche formulário + tira foto</li>
              <li>Sistema valida CPF e nome</li>
              <li>Foto é enviada para HikCentral via API REST</li>
              <li>Usuário é criado no HikCentral</li>
              <li>Reconhecimento facial é configurado</li>
              <li>Visitante pode acessar o condomínio</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs do Console</CardTitle>
          <CardDescription>
            Abra o console do navegador (F12) para ver logs detalhados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
            <p>🔍 Abra o console do navegador (F12) para ver logs detalhados</p>
            <p>✅ Logs de sucesso aparecerão em verde</p>
            <p>❌ Logs de erro aparecerão em vermelho</p>
            <p>💥 Exceções e detalhes técnicos serão exibidos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 