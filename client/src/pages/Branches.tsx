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

export function Branches() {
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        // Update
        await api.patch(`/branches/${editingBranch.id}`, formData);
      } else {
        // Create
        await api.post('/branches', formData);
      }
      setShowModal(false);
      setEditingBranch(null);
      setFormData({ name: '', code: '', address: '' });
      loadBranches();
    } catch (err) {
      console.error(err);
      alert('Error saving branch');
    }
  };

  const handleEdit = (b: any) => {
    setEditingBranch(b);
    setFormData({
      name: b.name,
      code: b.code,
      address: b.address || '',
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Are you sure you want to disable this branch?')) return;
    try {
      await api.post(`/branches/${id}/disable`);
      loadBranches();
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
        <h1 className="text-2xl font-black uppercase tracking-tighter">Branch Management</h1>
        <Button
          onClick={() => {
            setEditingBranch(null);
            setFormData({ name: '', code: '', address: '' });
            setShowModal(true);
          }}
        >
          Add Branch
        </Button>
      </div>

      <div className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-bold uppercase">{b.name}</TableCell>
                <TableCell className="font-mono text-sm">{b.code}</TableCell>
                <TableCell className="uppercase">{b.address || '-'}</TableCell>
                <TableCell>
                  <Badge variant={b.active ? 'success' : 'destructive'}>
                    {b.active ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(b)}
                    >
                        Edit
                    </Button>
                    {b.active && (
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => handleToggleStatus(b.id)} 
                      >
                        Disable
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {branches.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8 uppercase font-bold">No branches found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
            <h2 className="text-xl font-black uppercase mb-6">{editingBranch ? 'Edit Branch' : 'New Branch'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Branch Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Branch Code</label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Address</label>
                <textarea
                  className="flex w-full border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono transition-all min-h-[80px]"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
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
