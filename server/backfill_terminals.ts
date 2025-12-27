
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    include: { terminals: true }
  });

  for (const branch of branches) {
    if (branch.terminals.length === 0) {
      console.log(`Creating terminal for branch ${branch.name}`);
      await prisma.terminal.create({
        data: {
          name: 'POS Terminal',
          branchId: branch.id
        }
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
