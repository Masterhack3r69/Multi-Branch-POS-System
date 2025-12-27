import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add User
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Branch</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3">{u.branch?.name || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="p-3 flex space-x-2">
                  <button onClick={() => handleEdit(u)} className="text-blue-600 hover:underline">Edit</button>
                  <button 
                    onClick={() => handleToggleStatus(u.id, u.active)} 
                    className={`${u.active ? 'text-red-600' : 'text-green-600'} hover:underline`}
                  >
                    {u.active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full border p-2 rounded"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={!!editingUser} // Prevent email change for now to avoid conflicts logic simplicity
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Password {editingUser && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  className="w-full border p-2 rounded"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="CASHIER">Cashier</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Branch</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.branchId}
                  onChange={e => setFormData({...formData, branchId: e.target.value})}
                >
                  <option value="">None (Global/Head Office)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
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
