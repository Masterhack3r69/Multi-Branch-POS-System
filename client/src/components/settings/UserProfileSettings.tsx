import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export default function UserProfileSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      if (response.ok) {
        setMessage('Profile updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error updating profile');
      }
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">User Profile Settings</h2>
        
        {message && (
          <div className={`p-4 border-2 font-mono text-sm mb-4 rounded ${
            message.includes('success')
              ? 'border-green-600 bg-green-50 text-green-700'
              : 'border-red-600 bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Name
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Role
            </label>
            <div className="border-2 border-black p-3 bg-zinc-50 font-mono text-sm">
              {user?.role || 'Not available'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Branch Assignment
            </label>
            <div className="border-2 border-black p-3 bg-zinc-50 font-mono text-sm">
              {(user as any)?.branch?.name || 'Not Assigned'}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-zinc-800"
            >
              {loading ? 'Saving...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}