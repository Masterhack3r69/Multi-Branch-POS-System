
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    include: { terminals: true }
  });

  for (const branch of branches) {
    if (branch.terminals.length > 0) {
      // Rename first terminal to match branch code
      const term = branch.terminals[0];
      const newName = `${branch.code}-POS-01`;
      console.log(`Renaming ${term.name} to ${newName}`);
      await prisma.terminal.update({
        where: { id: term.id },
        data: { name: newName }
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
