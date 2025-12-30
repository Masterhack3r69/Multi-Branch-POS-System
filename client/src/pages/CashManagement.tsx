import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface CashSession {
  id: string;
  branchId: string;
  terminalId: string;
  cashierId: string;
  startTime: string;
  endTime?: string;
  startAmount: number;
  endAmount?: number;
  expectedAmount?: number;
  duration: number;
  totalTransactions: number;
  transactionCount: number;
  branch: { name: string };
  terminal: { name: string };
  cashier: { name: string };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    reason?: string;
    createdAt: string;
  }>;
}

export function CashManagement() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    activeOnly: false,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cash-view/sessions', {
        params: {
          activeOnly: filter.activeOnly
        }
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch cash sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/cash-view/stats', {
        params: {
          startDate: filter.startDate,
          endDate: filter.endDate
        }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch cash stats:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (session: CashSession) => {
    return session.endTime ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800';
  };

  const getStatusText = (session: CashSession) => {
    return session.endTime ? 'Completed' : 'Active';
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end border-b-4 border-black pb-4">
           <h1 className="text-4xl font-black uppercase tracking-tighter">Cash Management</h1>
        </div>
        <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-wider">
          Loading Cash Sessions...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end border-b-4 border-black pb-4">
         <h1 className="text-4xl font-black uppercase tracking-tighter">Cash Management</h1>
         <p className="text-zinc-500 font-mono text-sm uppercase">
           {user?.role} • {new Date().toLocaleDateString()}
         </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="space-y-3">
          <h2 className="text-2xl font-black uppercase tracking-tight">Session Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <p className="text-3xl font-black font-mono tracking-tight">
                    {stats.summary.totalSessions}
                 </p>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Active Now</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black font-mono tracking-tight text-green-600">
                       {stats.summary.activeSessions}
                    </p>
                    <span className="text-xs font-bold uppercase text-green-600">Sessions</span>
                 </div>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Currently open</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Total Float</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <p className="text-3xl font-black font-mono tracking-tight text-blue-600">
                    {formatCurrency(stats.transactions.totalFloatIn)}
                 </p>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Added this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Total Drops</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <p className="text-3xl font-black font-mono tracking-tight">
                    {formatCurrency(stats.transactions.totalDrops)}
                 </p>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Secured this period</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Total Payouts</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <p className="text-3xl font-black font-mono tracking-tight text-red-600">
                    {formatCurrency(stats.transactions.totalPayouts)}
                 </p>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Paid this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Variance</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <p className={`text-3xl font-black font-mono tracking-tight ${
                    Math.abs(stats.summary.variance) < 1 ? 'text-green-600' : 'text-red-600'
                 }`}>
                    {formatCurrency(stats.summary.variance)}
                 </p>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Actual vs Expected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <p className="text-3xl font-black font-mono tracking-tight">
                    {stats.transactions.totalTransactions}
                 </p>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">All cash movements</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <h2 className="text-2xl font-black uppercase tracking-tight">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-1">Active Sessions Only</label>
            <select
              className="w-full border border-black p-2 font-mono text-sm"
              value={filter.activeOnly ? 'true' : 'false'}
              onChange={(e) => setFilter(prev => ({ ...prev, activeOnly: e.target.value === 'true' }))}
            >
              <option value="false">All Sessions</option>
              <option value="true">Active Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold uppercase mb-1">Start Date</label>
            <Input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold uppercase mb-1">End Date</label>
            <Input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          
          <div className="flex items-end">
            <Button onClick={fetchStats} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tight">Cash Sessions</h2>
          <Button onClick={fetchSessions}>Refresh</Button>
        </div>
        
        {sessions.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cashier</TableHead>
                    <TableHead className="text-xs">Terminal</TableHead>
                    <TableHead className="text-xs">Start Time</TableHead>
                    <TableHead className="text-xs">End Time</TableHead>
                    <TableHead className="text-xs">Duration</TableHead>
                    <TableHead className="text-xs">Start Amount</TableHead>
                    <TableHead className="text-xs">End Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="py-2">
                        <div>
                          <div className="font-bold text-sm">{session.cashier.name}</div>
                          <div className="text-xs text-zinc-500">{session.branch.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm">{session.terminal.name}</div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm font-mono">{formatDateTime(session.startTime)}</div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm font-mono">
                          {session.endTime ? formatDateTime(session.endTime) : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm font-mono">{formatDuration(session.duration)}</div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm font-mono">{formatCurrency(session.startAmount)}</div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm font-mono">
                          {session.endAmount ? formatCurrency(session.endAmount) : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={getStatusColor(session)}>
                          {getStatusText(session)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm font-mono">{session.transactionCount}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-zinc-500 font-bold uppercase">No cash sessions found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}