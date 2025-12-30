import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function GeneralSettings() {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/settings/general');
      if (Array.isArray(response.data)) {
        // Initialize form values
        const values: Record<string, any> = {};
        response.data.forEach(setting => {
          values[setting.key] = setting.value;
        });
        setFormValues(values);
      } else {
        console.warn('Settings response is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    setMessage(null);
    try {
      const { api } = await import('@/lib/api');
      await api.patch(`/settings/${key}`, { value });
      setMessage({ type: 'success', text: `Setting updated successfully!` });
      setTimeout(() => setMessage(null), 2000);
    } catch (error: any) {
      console.error('Error updating setting:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update setting';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    // Update form value immediately for responsive UI
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));

    // Clear existing timer
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }

    // Debounce API call - wait 1 second after user stops typing
    debounceTimers.current[key] = setTimeout(() => {
      updateSetting(key, value);
    }, 1000);
  };

  if (loading) {
    return <div className="text-center py-8">Loading general settings...</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded border-2 ${
          message.type === 'success' 
            ? 'border-green-600 bg-green-50 text-green-700' 
            : 'border-red-600 bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Company Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Company Name
            </label>
            <Input
              value={formValues['company_name'] || ''}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Enter company name"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Default Currency
            </label>
            <Input
              value={formValues['default_currency'] || ''}
              onChange={(e) => handleInputChange('default_currency', e.target.value)}
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
              value={formValues['tax_rate'] || ''}
              onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
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
              value={formValues['low_stock_threshold'] || ''}
              onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 10)}
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
            value={formValues['receipt_footer'] || ''}
            onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
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
              value={formValues['session_timeout'] || ''}
              onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value) || 30)}
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
              value={formValues['auto_logout'] || ''}
              onChange={(e) => handleInputChange('auto_logout', parseInt(e.target.value) || 60)}
              placeholder="60"
              disabled={saving}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}