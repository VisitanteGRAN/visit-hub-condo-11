import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Search, 
  Filter, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Home, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Expand,
  Download,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/utils/secureLogger';

interface Resident {
  id: string;
  email: string;
  nome: string;
  unidade: string;
  telefone?: string;
  cpf?: string;
  foto?: string;
  created_at: string;
  updated_at: string;
  status: 'ativo' | 'pendente' | 'inativo';
  ativo: boolean;
  perfil: string;
  rg?: string;
  rua?: string;
  numeroRua?: string;
  quadra?: string;
  lote?: string;
}

export default function AdminResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, name: string} | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedResidentForTerms, setSelectedResidentForTerms] = useState<Resident | null>(null);

  const loadResidents = async () => {
    try {
      setIsLoading(true);
      logger.info('🏠 Carregando lista de moradores...');

      // 🛡️ DUPLA PROTEÇÃO: Tentar supabaseAdmin primeiro, depois fetch direto
      try {
        const { data, error } = await supabaseAdmin
          .from('usuarios')
          .select('*')
          .eq('perfil', 'morador')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('⚠️ Erro no supabaseAdmin, tentando fetch direto:', error.message);
          throw new Error('Fallback para fetch direto');
        }

        console.log('✅ Moradores carregados (supabaseAdmin):', data?.length || 0);
        console.log('📊 Exemplo de dados do primeiro morador:', data?.[0]);
        setResidents(data || []);
        setFilteredResidents(data || []);

      } catch (adminError) {
        console.log('🔄 Tentando fetch direto como fallback...');
        
        // 🚨 FALLBACK: Usar fetch direto com service key hardcoded
        const supabaseUrl = "https://rnpgtwughapxxvvckepd.supabase.co";
        const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.2t6m1iUk_TRXtbEACh-P6dKJWRqyeLBe1OrUZemFd90";
        
        const response = await fetch(`${supabaseUrl}/rest/v1/usuarios?select=*&perfil=eq.morador&order=created_at.desc`, {
          headers: {
            'apikey': serviceKey,
            'authorization': `Bearer ${serviceKey}`,
            'content-type': 'application/json',
            'accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro no fetch direto:', response.status, errorText);
          toast.error('Erro ao carregar lista de moradores');
          return;
        }

        const data = await response.json();
        console.log('✅ Moradores carregados (fetch direto):', data?.length || 0);
        console.log('📊 Exemplo de dados do primeiro morador (fetch):', data?.[0]);
        setResidents(data || []);
        setFilteredResidents(data || []);
      }

    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro ao carregar moradores');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar moradores baseado na busca e filtros
  useEffect(() => {
    let filtered = residents;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(resident =>
        resident.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.cpf?.includes(searchTerm) ||
        resident.telefone?.includes(searchTerm)
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(resident => {
        switch (statusFilter) {
          case 'ativo':
            return resident.ativo && resident.status === 'ativo';
          case 'pendente':
            return resident.status === 'pendente';
          case 'inativo':
            return !resident.ativo || resident.status === 'inativo';
          default:
            return true;
        }
      });
    }

    setFilteredResidents(filtered);
  }, [residents, searchTerm, statusFilter]);

  useEffect(() => {
    loadResidents();
  }, []);

  const getStatusBadge = (resident: Resident) => {
    if (resident.status === 'pendente') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
    if (resident.ativo && resident.status === 'ativo') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
    }
    return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Inativo</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Nome', 'Email', 'Unidade', 'Telefone', 'CPF', 'Status', 'Data Cadastro'].join(','),
      ...filteredResidents.map(resident => [
        resident.nome,
        resident.email,
        resident.unidade,
        resident.telefone || '',
        resident.cpf || '',
        resident.ativo && resident.status === 'ativo' ? 'Ativo' : resident.status === 'pendente' ? 'Pendente' : 'Inativo',
        formatDate(resident.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `moradores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Lista exportada com sucesso!');
  };

  const generateTermsContent = (resident: Resident) => {
    // 🏠 Construir endereço de forma inteligente baseado nos dados disponíveis
    let endereco = '';
    
    if (resident.rua && resident.numeroRua) {
      // Novo formato com rua e número
      endereco = `${resident.rua}, ${resident.numeroRua}`;
      
      // Adicionar quadra e lote se disponíveis (moradores novos)
      if (resident.quadra) {
        endereco += `, Quadra ${resident.quadra}`;
      }
      if (resident.lote) {
        endereco += `, Lote ${resident.lote}`;
      }
      
      endereco += ', Bairro: Condomínio Gran Royalle';
    } else {
      // Formato antigo - só unidade
      endereco = `${resident.unidade}, Bairro: Condomínio Gran Royalle`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Termo de Aceitação - ${resident.nome}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .owner-data { background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .owner-data h3 { color: #1e40af; margin-bottom: 15px; }
          .owner-data p { color: #1e40af; margin: 0; }
          .content { text-align: justify; margin-bottom: 20px; }
          .content p { margin-bottom: 15px; }
          .bold { font-weight: bold; }
          .signature-section { margin-top: 50px; }
          .signature-line { border-bottom: 1px solid #000; width: 300px; margin: 50px auto 10px; }
          .signature-text { text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TERMO DE ACEITAÇÃO</h1>
          <h2>Associação do Residencial Gran Royalle Aeroporto Confins</h2>
        </div>

        <div class="owner-data">
          <h3>DADOS DO PROPRIETÁRIO:</h3>
          <p><strong>${resident.nome}</strong><br>
          <strong>CPF:</strong> ${resident.cpf || 'Não informado'}<br>
          <strong>E-mail:</strong> ${resident.email}<br>
          <strong>Cel.:</strong> ${resident.telefone || 'Não informado'}<br>
          <strong>Endereço:</strong> ${endereco}<br>
          <strong>Cidade:</strong> Confins <strong>CEP:</strong> 33500-000</p>
        </div>

        <div class="content">
          <p>Declaro para os devidos fins que sou o real adquirente/proprietário do imóvel acima citado, nesta condição, 
          ratifico minha associação à <strong>Associação do Residencial Gran Royalle Aeroporto Confins</strong>, nos termos da cláusula sexta, 
          parágrafo primeiro, do contrato originário do referido imóvel, abaixo transcrita, bem como nos termos do 
          art. 78 da lei 13.465/17, contrato este referente a primeira venda feita pela incorporadora deste loteamento, 
          <strong>Gran Viver Urbanismo S/A</strong>, que se transcreve abaixo:</p>

          <p><em>"O adquirente desde já fica ciente de que o loteamento será administrado pela Associação do Residencial Gran Royalle Aeroporto Confins, 
          da qual será membro nato, devendo contribuir com as despesas de manutenção e conservação das áreas comuns, 
          bem como observar o regulamento interno a ser oportunamente aprovado."</em></p>

          <p><strong>Declaro ainda ter conhecimento das regras estabelecidas em nosso Estatuto, regimento interno e normas de utilização do clube e academia.</strong></p>
        </div>

        <div class="signature-section">
          <p>Confins, ${new Date().toLocaleDateString('pt-BR')}</p>
          <div class="signature-line"></div>
          <div class="signature-text">Assinatura do Proprietário</div>
        </div>
      </body>
      </html>
    `;
  };

  const handleViewTerms = (resident: Resident) => {
    setSelectedResidentForTerms(resident);
    setShowTermsModal(true);
  };

  const handleDownloadTerms = (resident: Resident) => {
    try {
      const htmlContent = generateTermsContent(resident);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Nome do arquivo baseado no nome do morador
      const fileName = `termo_aceitacao_${resident.nome.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.html`;
      
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success(`Termo de ${resident.nome} baixado com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar termo:', error);
      toast.error('Erro ao gerar termo de aceitação');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Moradores Cadastrados
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredResidents.length} de {residents.length} moradores
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={loadResidents}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              disabled={filteredResidents.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nome, email, unidade, CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Moradores */}
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando moradores...</p>
          </div>
        ) : filteredResidents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nenhum morador encontrado</h3>
              <p className="text-gray-600">
                {residents.length === 0 
                  ? 'Ainda não há moradores cadastrados no sistema.'
                  : 'Tente ajustar os filtros de busca.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredResidents.map((resident) => (
              <Card key={resident.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Foto */}
                      <div className="flex-shrink-0">
                        {resident.foto ? (
                          <div className="relative">
                            <img
                              src={resident.foto}
                              alt={`Foto de ${resident.nome}`}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                              onClick={() => setSelectedPhoto({url: resident.foto!, name: resident.nome})}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full bg-white"
                              onClick={() => setSelectedPhoto({url: resident.foto!, name: resident.nome})}
                            >
                              <Expand className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {resident.nome}
                          </h3>
                          {getStatusBadge(resident)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{resident.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span>{resident.unidade}</span>
                          </div>
                          
                          {resident.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{resident.telefone}</span>
                            </div>
                          )}
                          
                          {resident.cpf && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>CPF: {resident.cpf}</span>
                            </div>
                          )}
                          
                          {(resident.quadra || resident.lote) && (
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>
                                {resident.quadra && `Quadra: ${resident.quadra}`}
                                {resident.quadra && resident.lote && ' • '}
                                {resident.lote && `Lote: ${resident.lote}`}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Cadastro: {formatDate(resident.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Atualizado: {formatDate(resident.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleViewTerms(resident)}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Termo
                      </Button>
                      <Button
                        onClick={() => handleDownloadTerms(resident)}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Termo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Foto Expandida */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-2xl max-h-[90vh]">
              <img
                src={selectedPhoto.url}
                alt={`Foto de ${selectedPhoto.name}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
                size="sm"
              >
                ✕
              </Button>
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
                {selectedPhoto.name}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização do Termo */}
        {showTermsModal && selectedResidentForTerms && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5" />
                  Termo de Aceitação - {selectedResidentForTerms.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh] space-y-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">DADOS DO PROPRIETÁRIO:</h3>
                  <p className="text-blue-800">
                    <strong>{selectedResidentForTerms.nome}</strong><br />
                    <strong>CPF:</strong> {selectedResidentForTerms.cpf || 'Não informado'}<br />
                    <strong>E-mail:</strong> {selectedResidentForTerms.email}<br />
                    <strong>Cel.:</strong> {selectedResidentForTerms.telefone || 'Não informado'}<br />
                    <strong>Endereço:</strong> {(() => {
                      if (selectedResidentForTerms.rua && selectedResidentForTerms.numeroRua) {
                        let endereco = `${selectedResidentForTerms.rua}, ${selectedResidentForTerms.numeroRua}`;
                        if (selectedResidentForTerms.quadra) {
                          endereco += `, Quadra ${selectedResidentForTerms.quadra}`;
                        }
                        if (selectedResidentForTerms.lote) {
                          endereco += `, Lote ${selectedResidentForTerms.lote}`;
                        }
                        return endereco + ', Bairro: Condomínio Gran Royalle';
                      } else {
                        return `${selectedResidentForTerms.unidade}, Bairro: Condomínio Gran Royalle`;
                      }
                    })()}<br />
                    <strong>Cidade:</strong> Confins <strong>CEP:</strong> 33500-000
                  </p>
                </div>

                <div>
                  <p className="leading-relaxed mb-4">
                    Declaro para os devidos fins que sou o real adquirente/proprietário do imóvel acima citado, nesta condição, 
                    ratifico minha associação à <strong>Associação do Residencial Gran Royalle Aeroporto Confins</strong>, nos termos da cláusula sexta, 
                    parágrafo primeiro, do contrato originário do referido imóvel, abaixo transcrita, bem como nos termos do 
                    art. 78 da lei 13.465/17, contrato este referente a primeira venda feita pela incorporadora deste loteamento, 
                    <strong>Gran Viver Urbanismo S/A</strong>, que se transcreve abaixo:
                  </p>

                  <p className="leading-relaxed mb-4 italic bg-gray-50 p-3 rounded">
                    "O adquirente desde já fica ciente de que o loteamento será administrado pela Associação do Residencial Gran Royalle Aeroporto Confins, 
                    da qual será membro nato, devendo contribuir com as despesas de manutenção e conservação das áreas comuns, 
                    bem como observar o regulamento interno a ser oportunamente aprovado."
                  </p>

                  <p className="leading-relaxed font-medium mb-6">
                    <strong>Declaro ainda ter conhecimento das regras estabelecidas em nosso Estatuto, regimento interno e normas de utilização do clube e academia.</strong>
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-right text-gray-600 mb-8">
                    Confins, {new Date().toLocaleDateString('pt-BR')}
                  </p>
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-64 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Assinatura do Proprietário</p>
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 border-t">
                <Button
                  onClick={() => setShowTermsModal(false)}
                  variant="outline"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    handleDownloadTerms(selectedResidentForTerms);
                    setShowTermsModal(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Termo
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
