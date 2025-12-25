import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const createBranchSchema = z.object({
  name: z.string(),
  code: z.string(),
  address: z.string().optional(),
});

export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches' });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const data = createBranchSchema.parse(req.body);
    const branch = await prisma.branch.create({
      data,
    });
    res.json(branch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating branch' });
  }
};

export const getBranchTerminals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const terminals = await prisma.terminal.findMany({
      where: { branchId: id },
    });
    res.json(terminals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching terminals' });
  }
};
