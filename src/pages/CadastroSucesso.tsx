import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, User, Building } from 'lucide-react';

export default function CadastroSucesso() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const visitanteNome = searchParams.get('nome') || 'Visitante';
  const hikCentralId = searchParams.get('hikCentralId') || '';
  const validade = searchParams.get('validade') || '';
  const morador = searchParams.get('morador') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Cadastro Realizado!
          </CardTitle>
          <p className="text-green-600">
            Seu acesso foi criado com sucesso no HikCentral
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Visitante</p>
                <p className="text-sm text-green-600">{visitanteNome}</p>
              </div>
            </div>
            
            {morador && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Visitando</p>
                  <p className="text-sm text-blue-600">{morador}</p>
                </div>
              </div>
            )}
            
            {validade && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Válido até</p>
                  <p className="text-sm text-orange-600">{validade}</p>
                </div>
              </div>
            )}
          </div>
          
          {hikCentralId && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">ID HikCentral</p>
              <p className="text-xs text-gray-600 font-mono">{hikCentralId}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">✅ Próximos Passos:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Seu acesso foi criado no sistema HikCentral</li>
                <li>• Você pode acessar o condomínio pelos coletores</li>
                <li>• Apresente documento com foto na portaria</li>
                <li>• Acesso válido apenas no período indicado</li>
              </ul>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/')} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Finalizar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 