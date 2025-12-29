import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export function Users() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    branchId: '',
  });
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't send empty password
        await api.patch(`/users/${editingUser.id}`, updateData);
      } else {
        // Create
        await api.post('/users', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
      loadUsers();
    } catch (err) {
      console.error(err);
      alert('Error saving user');
    }
  };

  const handleEdit = (u: any) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // Don't show password
      role: u.role,
      branchId: u.branchId || '',
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.post(`/users/${id}/disable`, { active: !currentStatus });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (user?.role !== 'ADMIN') {
    return <div className="p-4">Access Denied</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase tracking-tighter">User Management</h1>
        <Button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
            setShowModal(true);
          }}
        >
          Add User
        </Button>
      </div>

      <div className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-bold uppercase">{u.name}</TableCell>
                <TableCell className="font-mono text-sm">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={
                    u.role === 'ADMIN' ? 'destructive' : // Admin = Red/Highest warning
                    u.role === 'MANAGER' ? 'warning' : 'default' // Manager = Yellow/Warning, Cashier = Default/Black
                  }>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="uppercase">{u.branch?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={u.active ? 'success' : 'outline'}>
                    {u.active ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(u)}
                    >
                        Edit
                    </Button>
                    <Button 
                      variant="link"
                      size="sm"
                      onClick={() => handleToggleStatus(u.id, u.active)} 
                      className={u.active ? 'text-red-600' : 'text-green-600'}
                    >
                      {u.active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center text-zinc-500 py-8 uppercase font-bold">No users found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-9999">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
            <h2 className="text-xl font-black uppercase mb-6">{editingUser ? 'Edit User' : 'New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Password {editingUser && '(Leave blank to keep current)'}</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Role</label>
                <select
                  className="flex h-10 w-full border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Branch</label>
                <select
                  className="flex h-10 w-full border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  value={formData.branchId}
                  onChange={e => setFormData({...formData, branchId: e.target.value})}
                >
                  <option value="">None (Global/Head Office)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-black mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
