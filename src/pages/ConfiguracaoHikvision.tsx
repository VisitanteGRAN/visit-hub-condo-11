import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Wifi, Users, TestTube, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import hikVisionWebSDK, { DeviceConfig, WebSDKResponse } from '@/services/webSDKService';

export default function ConfiguracaoHikvision() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<WebSDKResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: boolean }>({});
  const [collectors, setCollectors] = useState<DeviceConfig[]>([]);

  // Estados para configuração
  const [config, setConfig] = useState({
    username: 'luca',
    password: 'Luca123#',
    timeout: 30000
  });

  const handleLoadCollectors = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Carregando lista de coletores...');
      
      const collectorList = hikVisionWebSDK.getCollectors();
      setCollectors(collectorList);
      
      toast({
        title: "✅ Coletores carregados",
        description: `Encontrados ${collectorList.length} coletores configurados`,
      });

    } catch (error) {
      console.error('❌ Erro ao carregar coletores:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao carregar lista de coletores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Iniciando teste de conectividade...');
      
      toast({
        title: "🔄 Testando conectividade",
        description: "Conectando aos coletores...",
      });

      const result = await hikVisionWebSDK.testConnectivity();
      setTestResults(result);
      
      // Atualizar status das conexões
      const status = hikVisionWebSDK.getConnectionStatus();
      setConnectionStatus(status);

      if (result.success) {
        toast({
          title: "✅ Teste concluído",
          description: result.message,
        });
      } else {
        toast({
          title: "⚠️ Teste parcial",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      
      const errorResult: WebSDKResponse = {
        success: false,
        message: `Erro no teste: ${error}`
      };
      setTestResults(errorResult);
      
      toast({
        title: "❌ Erro no teste",
        description: "Falha ao testar conectividade com os coletores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestUserCreation = async () => {
    setIsLoading(true);
    
    try {
      console.log('👤 Testando criação de usuário...');
      
      toast({
        title: "🔄 Testando criação",
        description: "Criando usuário de teste...",
      });

      const testVisitor = {
        nome: 'Visitante Teste',
        cpf: '12345678901',
        telefone: '(11) 99999-9999',
        email: 'teste@visitante.com',
        documento: 'RG123456789'
      };

      const result = await hikVisionWebSDK.createVisitorInAllDevices(testVisitor);

      if (result.success) {
        toast({
          title: "✅ Usuário criado",
          description: result.message,
        });
      } else {
        toast({
          title: "❌ Falha na criação",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao criar usuário de teste",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuração HikVision WebSDK</h1>
          <p className="text-muted-foreground">Gerenciamento de integração com coletores DS-K1T671MF</p>
        </div>
      </div>

      {/* Configurações de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Configurações de Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="Usuário dos coletores"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="Senha dos coletores"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (ms)</Label>
            <Input
              id="timeout"
              type="number"
              value={config.timeout}
              onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
              placeholder="Timeout em milissegundos"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coletores Configurados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Coletores Configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleLoadCollectors}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
              Carregar Coletores
            </Button>
          </div>

          {collectors.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Coletores Encontrados:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {collectors.map((collector, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{collector.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {collector.ip}:{collector.port}
                      </p>
                    </div>
                    <Badge variant={connectionStatus[collector.name] ? "default" : "secondary"}>
                      {connectionStatus[collector.name] ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testes de Conectividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testes de Conectividade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleTestConnection}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
              Testar Conectividade
            </Button>
            
            <Button 
              onClick={handleTestUserCreation}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
              Testar Criação de Usuário
            </Button>
          </div>

          {testResults && (
            <Alert className={testResults.success ? "border-green-500" : "border-red-500"}>
              {testResults.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                <strong>{testResults.success ? 'Sucesso:' : 'Erro:'}</strong> {testResults.message}
                {testResults.data && (
                  <div className="mt-2 text-xs">
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(testResults.data, null, 2)}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Integração:</strong> HikCentral + WebSDK V3.3.1
            </div>
            <div>
              <strong>Modelo dos Coletores:</strong> DS-K1T671MF
            </div>
            <div>
              <strong>Grupo no HikCentral:</strong> "Visitantes"
            </div>
            <div>
              <strong>Total de Coletores:</strong> {collectors.length}
            </div>
            <div>
              <strong>Coletores de Entrada:</strong> 3
            </div>
            <div>
              <strong>Coletores de Saída:</strong> 2
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <strong className="text-sm">Funcionalidades Disponíveis:</strong>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>✅ Integração com HikCentral</li>
              <li>✅ Criação no grupo "Visitantes"</li>
              <li>✅ Associação automática com morador</li>
              <li>✅ Validade configurável (1-3 dias)</li>
              <li>✅ Distribuição automática aos coletores</li>
              <li>⏳ Upload de fotos (em desenvolvimento)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 