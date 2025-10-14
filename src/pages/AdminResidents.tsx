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
  RefreshCw
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
}

export default function AdminResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, name: string} | null>(null);

  const loadResidents = async () => {
    try {
      setIsLoading(true);
      logger.info('🏠 Carregando lista de moradores...');

      // Buscar todos os usuários com perfil 'morador'
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('perfil', 'morador')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar moradores:', error);
        toast.error('Erro ao carregar lista de moradores');
        return;
      }

      console.log('✅ Moradores carregados:', data?.length || 0);
      setResidents(data || []);
      setFilteredResidents(data || []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
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
      </div>
    </div>
  );
}
