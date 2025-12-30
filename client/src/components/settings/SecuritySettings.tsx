import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export function SecuritySettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { api } = await import('@/lib/api');
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.status === 200) {
        setMessage('Password changed successfully');
        setMessageType('success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setMessage(response.data.message || 'Error changing password');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error changing password');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Change Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Current Password
            </label>
            <Input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Enter current password"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              New Password
            </label>
            <Input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Enter new password (min 6 characters)"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              disabled={loading}
              required
            />
          </div>

          {message && (
            <div
              className={`p-4 border-2 font-mono text-sm ${
                messageType === 'success'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-red-500 bg-red-50 text-red-700'
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-zinc-800"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Session Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              User ID
            </label>
            <Input
              value={user?.id || ''}
              disabled
              className="bg-zinc-50 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Last Login
            </label>
            <Input
              value="Not tracked" // This could be enhanced to track actual last login
              disabled
              className="bg-zinc-50"
            />
          </div>

          <div className="pt-4 border-t-2 border-black">
            <p className="text-sm text-zinc-600">
              For security reasons, you will be automatically logged out after a period of inactivity.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}