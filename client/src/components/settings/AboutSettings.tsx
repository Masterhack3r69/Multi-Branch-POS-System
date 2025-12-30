import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

export function AboutSettings() {
  const { user } = useAuthStore();

  const systemInfo = {
    name: 'Multi-Branch POS System',
    version: '1.0.0',
    buildDate: new Date().toLocaleDateString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL',
    backend: 'Node.js + Express',
    frontend: 'React + TypeScript',
    databaseProvider: 'Prisma',
    authentication: 'JWT',
    realtime: 'Socket.IO',
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">System Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-wide text-sm text-zinc-500">Application</h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                System Name
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                Version
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.version}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                Build Date
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.buildDate}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                Environment
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.environment}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-wide text-sm text-zinc-500">Technology Stack</h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                Database
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.database}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                Backend
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.backend}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                Frontend
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.frontend}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
                Database ORM
              </label>
              <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
                {systemInfo.databaseProvider}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">User Session</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
              Current User
            </label>
            <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
              {user?.name || 'Unknown'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
              User Role
            </label>
            <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
              {user?.role || 'Unknown'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
              User ID
            </label>
            <div className="font-mono text-xs border-2 border-black p-2 bg-zinc-50">
              {user?.id || 'Unknown'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-zinc-500">
              Branch Assignment
            </label>
            <div className="font-mono text-sm border-2 border-black p-2 bg-zinc-50">
              {user?.branchId || 'Not Assigned'}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide mb-6">Legal & Support</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-black pl-4">
            <h3 className="font-bold uppercase tracking-wide text-sm mb-2">License Information</h3>
            <p className="text-sm text-zinc-600">
              This software is proprietary and confidential. Unauthorized distribution or modification is prohibited.
            </p>
          </div>

          <div className="border-l-4 border-black pl-4">
            <h3 className="font-bold uppercase tracking-wide text-sm mb-2">Support</h3>
            <p className="text-sm text-zinc-600 mb-2">
              For technical support and assistance:
            </p>
            <div className="font-mono text-sm space-y-1">
              <div>Email: support@pos-system.com</div>
              <div>Phone: 1-800-POS-HELP</div>
              <div>Documentation: https://docs.pos-system.com</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}