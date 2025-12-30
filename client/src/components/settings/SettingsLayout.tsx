import { useAuthStore } from '@/store/authStore';

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsLayout({ children, activeTab, onTabChange }: SettingsLayoutProps) {
  const { user } = useAuthStore();

  const tabs = [
    { id: 'general', label: 'General', roles: ['ADMIN'] },
    { id: 'security', label: 'Security', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'about', label: 'About', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'guide', label: 'Guide', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  ];

  const availableTabs = tabs.filter(tab => 
    tab.roles.includes(user?.role || '')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase">Settings</h1>
        <p className="text-sm text-zinc-500 mt-2">
          Manage system configuration and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b-2 border-black">
        <nav className="flex gap-8">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                pb-3 px-1 font-bold text-sm uppercase tracking-wide transition-colors
                ${activeTab === tab.id 
                  ? 'text-black border-b-2 border-black -mb-px' 
                  : 'text-zinc-400 hover:text-black'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {children}
      </div>
    </div>
  );
}