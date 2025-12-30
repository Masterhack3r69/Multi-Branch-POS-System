import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log('Admin user created');
  }

  // Create a branch
  const branchCode = 'MAIN';
  let branch = await prisma.branch.findUnique({ where: { code: branchCode } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        code: branchCode,
        address: '123 Main St',
      },
    });
    console.log('Main branch created');
  } else {
      console.log('Main branch already exists');
  }

  // Create a terminal
  if (branch) {
      const existingTerminal = await prisma.terminal.findFirst({ where: { branchId: branch.id, name: 'Terminal 1' } });
      if (!existingTerminal) {
        await prisma.terminal.create({
            data: {
                name: 'Terminal 1',
                branchId: branch.id
            }
        });
        console.log('Terminal 1 created');
      }
  }

  // Create products
  const productSku = 'PROD-001';
  const existingProduct = await prisma.product.findUnique({ where: { sku: productSku } });
  if (!existingProduct) {
      const product = await prisma.product.create({
          data: {
              name: 'Sample Product',
              sku: productSku,
              price: 100.0,
          }
      });
      // Create SKU
      await prisma.sKU.create({
          data: {
              productId: product.id,
              name: 'Sample Product Standard',
              barcode: '1234567890123'
          }
      });
      console.log('Sample product created');
  }

  // Create default system settings
  const defaultSettings = [
    // General Settings
    { key: 'company_name', value: 'My POS Business', category: 'general', scope: 'global' },
    { key: 'default_currency', value: 'USD', category: 'general', scope: 'global' },
    { key: 'tax_rate', value: 8.5, category: 'general', scope: 'global' },
    { key: 'low_stock_threshold', value: 10, category: 'general', scope: 'global' },
    { key: 'receipt_footer', value: 'Thank you for your business!', category: 'general', scope: 'global' },
    { key: 'session_timeout', value: 30, category: 'general', scope: 'global' },
    { key: 'auto_logout', value: 60, category: 'general', scope: 'global' },
    
    // About Settings (system information)
    { key: 'system_name', value: 'Multi-Branch POS System', category: 'about', scope: 'global' },
    { key: 'system_version', value: '1.0.0', category: 'about', scope: 'global' },
    { key: 'support_email', value: 'support@pos-system.com', category: 'about', scope: 'global' },
    { key: 'support_phone', value: '1-800-POS-HELP', category: 'about', scope: 'global' },
  ];

  for (const setting of defaultSettings) {
    const existing = await (prisma as any).systemSetting.findFirst({
      where: {
        key: setting.key,
        scope: setting.scope,
        scopeId: null
      }
    });

    if (!existing) {
      await (prisma as any).systemSetting.create({
        data: {
          ...setting,
          scopeId: null
        }
      });
      console.log(`Created setting: ${setting.key}`);
    }
  }

  console.log('Default system settings created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
