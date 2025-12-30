import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface GeneralSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  scope: string;
  scopeId: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function GeneralSettings() {
  const [settings, setSettings] = useState<GeneralSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/settings/general');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.patch(`/settings/${key}`, { value });
      if (response.status === 200) {
        fetchSettings(); // Refresh settings
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : '';
  };

  if (loading) {
    return <div className="text-center py-8">Loading general settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Company Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Company Name
            </label>
            <Input
              value={getSettingValue('company_name')}
              onChange={(e) => updateSetting('company_name', e.target.value)}
              placeholder="Enter company name"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Default Currency
            </label>
            <Input
              value={getSettingValue('default_currency')}
              onChange={(e) => updateSetting('default_currency', e.target.value)}
              placeholder="USD"
              disabled={saving}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Tax & Pricing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Tax Rate (%)
            </label>
            <Input
              type="number"
              step="0.01"
              value={getSettingValue('tax_rate')}
              onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Low Stock Threshold
            </label>
            <Input
              type="number"
              value={getSettingValue('low_stock_threshold')}
              onChange={(e) => updateSetting('low_stock_threshold', parseInt(e.target.value) || 10)}
              placeholder="10"
              disabled={saving}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Receipt Settings</h2>
        
        <div>
          <label className="block text-sm font-bold uppercase tracking-wide mb-2">
            Receipt Footer
          </label>
          <textarea
            className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-zinc-50"
            rows={3}
            value={getSettingValue('receipt_footer')}
            onChange={(e) => updateSetting('receipt_footer', e.target.value)}
            placeholder="Thank you for your business!"
            disabled={saving}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">System Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Session Timeout (minutes)
            </label>
            <Input
              type="number"
              value={getSettingValue('session_timeout')}
              onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value) || 30)}
              placeholder="30"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Auto Logout (minutes)
            </label>
            <Input
              type="number"
              value={getSettingValue('auto_logout')}
              onChange={(e) => updateSetting('auto_logout', parseInt(e.target.value) || 60)}
              placeholder="60"
              disabled={saving}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}