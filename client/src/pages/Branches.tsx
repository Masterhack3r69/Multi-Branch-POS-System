import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Branch Management</h1>
        <button
          onClick={() => {
            setEditingBranch(null);
            setFormData({ name: '', code: '', address: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Branch
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3">Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Address</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{b.name}</td>
                <td className="p-3 font-mono text-sm">{b.code}</td>
                <td className="p-3">{b.address || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${b.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {b.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="p-3 flex space-x-2">
                  <button onClick={() => handleEdit(b)} className="text-blue-600 hover:underline">Edit</button>
                  {b.active && (
                    <button 
                      onClick={() => handleToggleStatus(b.id)} 
                      className="text-red-600 hover:underline"
                    >
                      Disable
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {branches.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No branches found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingBranch ? 'Edit Branch' : 'New Branch'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Branch Name</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Branch Code</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Address</label>
                <textarea
                  className="w-full border p-2 rounded"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
