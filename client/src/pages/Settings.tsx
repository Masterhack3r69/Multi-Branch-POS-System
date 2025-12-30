import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AboutSettings } from '@/components/settings/AboutSettings';
import { GuideSettings } from '@/components/settings/GuideSettings';

export function Settings() {
  const [activeTab, setActiveTab] = useState('security');
  const { user } = useAuthStore();
 
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return user?.role === 'ADMIN' ? <GeneralSettings /> : <div>Access Denied</div>;
      case 'security':
        return <SecuritySettings />;
      case 'about':
        return <AboutSettings />;
      case 'guide':
        return <GuideSettings />;
      default:
        return <SecuritySettings />;
    }
  };
 
  return (
    <SettingsLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </SettingsLayout>
  );
}