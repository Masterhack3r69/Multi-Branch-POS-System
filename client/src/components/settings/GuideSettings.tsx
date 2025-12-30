import { Card } from '@/components/ui/Card';

export function GuideSettings() {
  const guides = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of the POS system and how to perform common tasks.',
      sections: [
        'Logging in and understanding the dashboard',
        'Processing your first sale',
        'Managing products and inventory',
        'Understanding roles and permissions',
      ]
    },
    {
      id: 'sales-operations',
      title: 'Sales Operations',
      description: 'Complete guide to processing sales, refunds, and managing transactions.',
      sections: [
        'Processing cash and card payments',
        'Handling multiple payment methods',
        'Processing refunds and returns',
        'Managing cash sessions',
        'Generating sales receipts',
      ]
    },
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      description: 'How to manage products, track stock, and handle inventory operations.',
      sections: [
        'Adding new products and SKUs',
        'Updating product information',
        'Stock level management',
        'Low stock alerts',
        'Inventory adjustments and corrections',
        'Stock transfers between branches',
      ]
    },
    {
      id: 'branch-operations',
      title: 'Branch Operations',
      description: 'Managing multi-branch operations and branch-specific settings.',
      sections: [
        'Branch setup and configuration',
        'Managing branch users',
        'Branch-specific inventory',
        'Inter-branch operations',
        'Branch reporting',
      ]
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Creating and managing user accounts, roles, and permissions.',
      sections: [
        'Creating new user accounts',
        'Role-based access control',
        'Managing user permissions',
        'User activity monitoring',
        'Security best practices',
      ]
    },
    {
      id: 'reports-analytics',
      title: 'Reports and Analytics',
      description: 'Generating reports and analyzing business performance data.',
      sections: [
        'Sales reports and analytics',
        'Inventory reports',
        'User activity reports',
        'Financial summaries',
        'Custom report generation',
        'Data export functionality',
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and their solutions.',
      sections: [
        'Connection issues',
        'Printer problems',
        'Payment processing errors',
        'Inventory sync issues',
        'Performance optimization',
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-2">User Guide</h2>
        <p className="text-sm text-zinc-600 mb-6">
          Comprehensive guides to help you get the most out of the POS system.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide) => (
            <div key={guide.id} className="border-2 border-black p-4">
              <h3 className="font-bold uppercase tracking-wide text-sm mb-2">
                {guide.title}
              </h3>
              <p className="text-xs text-zinc-600 mb-4">
                {guide.description}
              </p>
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wide text-xs text-zinc-500">
                  Topics Covered:
                </h4>
                <ul className="space-y-1">
                  {guide.sections.map((section, index) => (
                    <li key={index} className="text-xs font-mono flex items-start">
                      <span className="mr-2">•</span>
                      <span>{section}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Quick Reference</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold uppercase tracking-wide text-sm mb-3 text-zinc-500">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>Search Products</span>
                <span className="border border-black px-1">Ctrl+F</span>
              </div>
              <div className="flex justify-between">
                <span>New Sale</span>
                <span className="border border-black px-1">Ctrl+N</span>
              </div>
              <div className="flex justify-between">
                <span>Open Cash Drawer</span>
                <span className="border border-black px-1">F12</span>
              </div>
              <div className="flex justify-between">
                <span>Logout</span>
                <span className="border border-black px-1">Ctrl+L</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase tracking-wide text-sm mb-3 text-zinc-500">
              Common Tasks
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold">Process Sale:</span>
                Terminal → Add Items → Payment
              </div>
              <div>
                <span className="font-bold">Add Product:</span>
                Products → New Product → Save
              </div>
              <div>
                <span className="font-bold">Update Stock:</span>
                Inventory → Select Item → Adjust
              </div>
              <div>
                <span className="font-bold">View Reports:</span>
                Reports → Select Report Type
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase tracking-wide text-sm mb-3 text-zinc-500">
              Support Channels
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="font-bold">Help Desk:</span>
                <div>extension 1234</div>
              </div>
              <div>
                <span className="font-bold">Email:</span>
                <div>support@company.com</div>
              </div>
              <div>
                <span className="font-bold">Emergency:</span>
                <div>extension 9999</div>
              </div>
              <div>
                <span className="font-bold">Documentation:</span>
                <div>internal.wiki/pos</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Video Tutorials</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'POS Basics', duration: '5 min', level: 'Beginner' },
            { title: 'Inventory Management', duration: '8 min', level: 'Intermediate' },
            { title: 'Sales Reports', duration: '6 min', level: 'Beginner' },
            { title: 'User Management', duration: '10 min', level: 'Advanced' },
            { title: 'Multi-Branch Setup', duration: '12 min', level: 'Advanced' },
            { title: 'Troubleshooting', duration: '7 min', level: 'All Levels' },
          ].map((video, index) => (
            <div key={index} className="border-2 border-black p-4">
              <div className="aspect-video bg-zinc-100 border-2 border-black mb-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-zinc-400">▶</span>
              </div>
              <h4 className="font-bold uppercase tracking-wide text-sm mb-1">
                {video.title}
              </h4>
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>{video.duration}</span>
                <span>{video.level}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}