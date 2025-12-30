import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AboutSettings } from '@/components/settings/AboutSettings';
import { GuideSettings } from '@/components/settings/GuideSettings';
import UserProfileSettings from '@/components/settings/UserProfileSettings';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile'); // Default to profile for non-admins
  const { user } = useAuthStore();
 
  // Set initial tab based on user role
  useEffect(() => {
    if (user?.role !== 'ADMIN' && activeTab === 'general') {
      setActiveTab('profile');
    }
  }, [user, activeTab]);
 
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return user?.role === 'ADMIN' ? <GeneralSettings /> : <div>Access Denied</div>;
      case 'profile':
        return <UserProfileSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'about':
        return <AboutSettings />;
      case 'guide':
        return <GuideSettings />;
      default:
        return <UserProfileSettings />;
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