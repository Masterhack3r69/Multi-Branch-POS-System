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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
