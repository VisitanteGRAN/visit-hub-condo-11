import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import hikVisionWebSDK from '@/services/webSDKService';

export default function TesteHikvision() {
  const [connectivityResults, setConnectivityResults] = useState<any[]>([]);
  const [userCheckResults, setUserCheckResults] = useState<any[]>([]);
  const [cpfToCheck, setCpfToCheck] = useState('16806418678');
  const [loading, setLoading] = useState(false);

  const testConnectivity = async () => {
    setLoading(true);
    try {
      const result = await hikVisionWebSDK.testCollectorConnectivity();
      setConnectivityResults(result.results);
      console.log('🔍 Resultado conectividade:', result);
    } catch (error) {
      console.error('❌ Erro no teste de conectividade:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserExists = async () => {
    setLoading(true);
    try {
      const result = await hikVisionWebSDK.checkUserExists(cpfToCheck);
      setUserCheckResults(result.results);
      console.log('🔍 Resultado verificação usuário:', result);
    } catch (error) {
      console.error('❌ Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
      case 'SUCCESS':
        return 'bg-green-500';
      case 'ONLINE_BUT_NO_ACCESS':
        return 'bg-yellow-500';
      case 'OFFLINE':
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🧪 Teste Hikvision</h1>
        <Badge variant="outline">Diagnóstico de Coletores</Badge>
      </div>

      {/* Teste de Conectividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Teste de Conectividade
            <Button 
              onClick={testConnectivity} 
              disabled={loading}
            >
              {loading ? 'Testando...' : 'Testar Conectividade'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectivityResults.length > 0 && (
            <div className="space-y-4">
              {connectivityResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.collector}</h3>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  {result.error && (
                    <p className="text-red-600 text-sm">❌ {result.error}</p>
                  )}
                  {result.deviceInfo && (
                    <p className="text-sm text-gray-600">📱 {result.deviceInfo}</p>
                  )}
                  {result.userCount && (
                    <p className="text-sm text-blue-600">👥 {result.userCount}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verificação de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👤 Verificar Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="cpf">CPF do Usuário</Label>
              <Input
                id="cpf"
                value={cpfToCheck}
                onChange={(e) => setCpfToCheck(e.target.value)}
                placeholder="16806418678"
              />
            </div>
            <Button 
              onClick={checkUserExists} 
              disabled={loading}
              className="mt-6"
            >
              {loading ? 'Verificando...' : 'Verificar Usuário'}
            </Button>
          </div>

          {userCheckResults.length > 0 && (
            <div className="space-y-4">
              {userCheckResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.collector}</h3>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                      {result.exists !== undefined && (
                        <Badge>
                          {result.exists ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {result.error && (
                    <p className="text-red-600 text-sm">❌ {result.error}</p>
                  )}
                  {result.response && (
                    <p className="text-sm text-gray-600">📄 {result.response}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instruções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Teste de Conectividade:</strong> Verifica se os coletores estão online e respondendo</p>
          <p><strong>2. Verificação de Usuário:</strong> Busca um usuário específico nos coletores</p>
          <p><strong>3. Status:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><span className="text-green-600">ONLINE/SUCCESS:</span> Coletor funcionando</li>
            <li><span className="text-yellow-600">ONLINE_BUT_NO_ACCESS:</span> Conecta mas sem permissão</li>
            <li><span className="text-red-600">OFFLINE/ERROR:</span> Coletor não responde</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 