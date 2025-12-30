import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export default function UserProfileSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email
        })
      });

      if (response.ok) {
        setMessage('Profile updated successfully');
      } else {
        setMessage('Error updating profile');
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
          <div className="p-4 border-2 border-black font-mono text-sm">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Name
            </label>
            <div className="border-2 border-black p-3 bg-zinc-50 font-mono text-sm">
              {user?.name || 'Not available'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Email
            </label>
            <div className="border-2 border-black p-3 bg-zinc-50 font-mono text-sm">
              {user?.email || 'Not available'}
            </div>
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
              {user?.branch?.name || 'Not Assigned'}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-black text-white hover:bg-zinc-800"
            >
              {loading ? 'Saving...' : 'Update Profile'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}