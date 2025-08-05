import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Mock data
const mockVisitors = [
  {
    id: 1,
    name: 'Maria Silva',
    document: '123.456.789-00',
    phone: '(11) 99999-9999',
    date: '2024-08-05',
    time: '14:30',
    status: 'autorizado',
    purpose: 'Entrega de encomenda'
  },
  {
    id: 2,
    name: 'João Santos',
    document: '987.654.321-00',
    phone: '(11) 88888-8888',
    date: '2024-08-05',
    time: '16:00',
    status: 'aguardando',
    purpose: 'Visita social'
  },
  {
    id: 3,
    name: 'Ana Costa',
    document: '456.789.123-00',
    phone: '(11) 77777-7777',
    date: '2024-08-04',
    time: '18:30',
    status: 'concluido',
    purpose: 'Manutenção'
  },
  {
    id: 4,
    name: 'Pedro Oliveira',
    document: '321.654.987-00',
    phone: '(11) 66666-6666',
    date: '2024-08-03',
    time: '10:00',
    status: 'cancelado',
    purpose: 'Consulta veterinária'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'autorizado': return 'default';
    case 'aguardando': return 'secondary';
    case 'concluido': return 'outline';
    case 'cancelado': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'autorizado': return CheckCircle;
    case 'aguardando': return Clock;
    case 'concluido': return CheckCircle;
    case 'cancelado': return XCircle;
    default: return Clock;
  }
};

export default function MeusVisitantes() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVisitors = mockVisitors.filter(visitor =>
    visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.document.includes(searchTerm) ||
    visitor.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Meus Visitantes">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar visitantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild>
            <Link to="/novo-visitante">
              <Plus className="h-4 w-4 mr-2" />
              Novo Visitante
            </Link>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVisitors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Autorizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {mockVisitors.filter(v => v.status === 'autorizado').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {mockVisitors.filter(v => v.status === 'aguardando').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {mockVisitors.filter(v => v.status === 'concluido').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitors List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Visitantes</CardTitle>
            <CardDescription>
              Gerencie todos os seus visitantes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredVisitors.map((visitor) => {
                const StatusIcon = getStatusIcon(visitor.status);
                return (
                  <div 
                    key={visitor.id} 
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
                        <div>
                          <p className="font-medium">{visitor.name}</p>
                          <p className="text-sm text-muted-foreground">{visitor.document}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(visitor.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {visitor.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Motivo</p>
                          <p className="text-sm text-muted-foreground">{visitor.purpose}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Telefone</p>
                          <p className="text-sm text-muted-foreground">{visitor.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(visitor.status)}>
                        {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredVisitors.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum visitante encontrado</p>
                <Button asChild className="mt-4">
                  <Link to="/novo-visitante">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Visitante
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}