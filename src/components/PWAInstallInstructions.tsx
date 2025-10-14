import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Download, 
  Share, 
  Plus, 
  ChevronDown,
  ChevronUp,
  Chrome,
  Apple
} from 'lucide-react';

export default function PWAInstallInstructions() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 border-primary/20">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Smartphone className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Baixar como App</CardTitle>
        </div>
        <CardDescription>
          Instale o Gran Royalle como um app no seu celular para acesso rápido
        </CardDescription>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 mx-auto flex items-center gap-2"
        >
          {isExpanded ? 'Ocultar instruções' : 'Ver como instalar'}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <Tabs defaultValue="android" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="android" className="flex items-center gap-2">
                <Chrome className="h-4 w-4" />
                Android
              </TabsTrigger>
              <TabsTrigger value="ios" className="flex items-center gap-2">
                <Apple className="h-4 w-4" />
                iPhone/iPad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="android" className="space-y-4 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-center">📱 Android (Chrome)</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Toque nos 3 pontinhos (⋮)</p>
                      <p className="text-sm text-muted-foreground">
                        Menu no canto superior direito do navegador
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">Selecione "Adicionar à tela inicial"</p>
                        <p className="text-sm text-muted-foreground">
                          Ou "Instalar app" se disponível
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Confirme a instalação</p>
                      <p className="text-sm text-muted-foreground">
                        O app aparecerá na sua tela inicial
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ <strong>Pronto!</strong> Agora você pode abrir o Gran Royalle direto da tela inicial, como um app normal!
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ios" className="space-y-4 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-center">🍎 iPhone/iPad (Safari)</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">Toque no ícone "Compartilhar"</p>
                        <p className="text-sm text-muted-foreground">
                          Ícone de compartilhar na parte inferior do Safari
                        </p>
                      </div>
                      <Share className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">Selecione "Adicionar à Tela de Início"</p>
                        <p className="text-sm text-muted-foreground">
                          Procure pelo ícone de "+" na lista de opções
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Confirme tocando em "Adicionar"</p>
                      <p className="text-sm text-muted-foreground">
                        O app aparecerá na sua tela inicial
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Dica:</strong> No iPhone, você precisa usar o Safari. O Chrome não permite adicionar à tela inicial.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ <strong>Pronto!</strong> Agora você pode abrir o Gran Royalle direto da tela inicial, como um app normal!
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Vantagens do App:
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Acesso rápido direto da tela inicial</li>
              <li>• Funciona offline (páginas visitadas)</li>
              <li>• Interface otimizada para celular</li>
              <li>• Notificações (em breve)</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
