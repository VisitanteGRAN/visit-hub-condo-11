import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  Clock, 
  CheckCircle, 
  Building2,
  MapPin,
  Phone,
  Calendar
} from 'lucide-react';
import { useState } from 'react';

// Mock data para demonstração
const mockMoradores = [
  {
    id: 1,
    name: 'João Silva',
    apartamento: '101',
    visitantes: [
      {
        id: 1,
        firstName: 'Maria',
        fullName: 'Maria Santos',
        document: '123.456.789-00',
        phone: '(11) 99999-9999',
        status: 'autorizado',
        createdAt: '2024-08-05 14:30',
        linkSent: '2024-08-05 13:00',
        authorizedAt: '2024-08-05 14:30',
        validUntil: '2024-08-06'
      },
      {
        id: 2,
        firstName: 'Carlos',
        fullName: 'Carlos Oliveira',
        document: '987.654.321-00',
        phone: '(11) 88888-8888',
        status: 'dentro',
        createdAt: '2024-08-05 15:00',
        entryTime: '2024-08-05 15:30',
        validUntil: '2024-08-07'
      }
    ]
  },
  {
    id: 2,
    name: 'Ana Costa',
    apartamento: '205',
    visitantes: [
      {
        id: 3,
        firstName: 'Pedro',
        fullName: 'Pedro Ferreira',
        document: '456.789.123-00',
        phone: '(11) 77777-7777',
        status: 'autorizado',
        createdAt: '2024-08-05 16:00',
        authorizedAt: '2024-08-05 16:15',
        validUntil: '2024-08-08'
      }
    ]
  },
  {
    id: 3,
    name: 'Roberto Lima',
    apartamento: '304',
    visitantes: [
      {
        id: 4,
        firstName: 'Julia',
        fullName: 'Julia Martins',
        document: '321.654.987-00',
        phone: '(11) 66666-6666',
        status: 'finalizado',
        createdAt: '2024-08-04 18:00',
        exitTime: '2024-08-04 19:30',
        validUntil: '2024-08-04'
      }
    ]
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pendente': return 'secondary';
    case 'autorizado': return 'default';
    case 'dentro': return 'outline';
    case 'finalizado': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pendente': return Clock;
    case 'autorizado': return CheckCircle;
    case 'dentro': return MapPin;
    case 'finalizado': return CheckCircle;
    default: return Clock;
  }
};

export default function GestaoVisitantes() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMoradores = mockMoradores.filter(morador =>
    morador.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    morador.apartamento.includes(searchTerm) ||
    morador.visitantes.some(v => 
      v.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const allVisitors = mockMoradores.flatMap(m => 
    m.visitantes.map(v => ({ ...v, morador: m }))
  );

  const pendentes = allVisitors.filter(v => v.status === 'pendente');
  const autorizados = allVisitors.filter(v => v.status === 'autorizado');
  const dentro = allVisitors.filter(v => v.status === 'dentro');
  const finalizados = allVisitors.filter(v => v.status === 'finalizado');

  const moveVisitor = (visitorId: number, newStatus: string) => {
    // Aqui será implementada a lógica do backend
    console.log(`Moving visitor ${visitorId} to ${newStatus}`);
  };

  const KanbanColumn = ({ title, visitors, status, icon: Icon, count }: any) => (
    <Card className="flex-1 min-h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4" />
          {title}
          <Badge variant="outline" className="ml-auto">
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visitors.map((visitor: any) => (
          <Card key={visitor.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {visitor.firstName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{visitor.firstName}</p>
                    <p className="text-xs text-muted-foreground">
                      {visitor.fullName || 'Dados não preenchidos'}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusColor(status)} className="text-xs">
                  {status}
                </Badge>
              </div>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span>Apto {visitor.morador.apartamento} - {visitor.morador.name}</span>
                </div>
                
                {visitor.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{visitor.phone}</span>
                  </div>
                )}
                
                 <div className="flex items-center gap-1">
                   <Calendar className="h-3 w-3" />
                   <span>{new Date(visitor.createdAt).toLocaleString('pt-BR')}</span>
                 </div>
                 
                 {visitor.validUntil && (
                   <div className="flex items-center gap-1 text-warning">
                     <Calendar className="h-3 w-3" />
                     <span>Válido até: {new Date(visitor.validUntil).toLocaleDateString('pt-BR')}</span>
                   </div>
                 )}
              </div>

              
              {status === 'autorizado' && (
                <div className="flex gap-1 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1 h-7 text-xs"
                    onClick={() => moveVisitor(visitor.id, 'dentro')}
                  >
                    Confirmar Entrada
                  </Button>
                </div>
              )}
              
              {status === 'dentro' && (
                <div className="flex gap-1 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => moveVisitor(visitor.id, 'finalizado')}
                  >
                    Registrar Saída
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        
        {visitors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum visitante</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Gestão de Visitantes">
      <div className="space-y-6">
        {/* Header e busca */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por morador, apartamento ou visitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Autorizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{autorizados.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">No Condomínio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{dentro.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Finalizados Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{finalizados.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <KanbanColumn
            title="Autorizados"
            visitors={autorizados}
            status="autorizado"
            icon={CheckCircle}
            count={autorizados.length}
          />
          <KanbanColumn
            title="No Condomínio"
            visitors={dentro}
            status="dentro"
            icon={MapPin}
            count={dentro.length}
          />
          <KanbanColumn
            title="Finalizados"
            visitors={finalizados}
            status="finalizado"
            icon={CheckCircle}
            count={finalizados.length}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}