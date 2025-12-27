import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const createBranchSchema = z.object({
  name: z.string(),
  code: z.string(),
  address: z.string().optional(),
});

const updateBranchSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().optional(),
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
      data: {
        ...data,
        terminals: {
          create: {
            name: `${data.code}-POS-01`
          }
        }
      },
      include: { terminals: true }
    });
    res.json(branch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating branch' });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateBranchSchema.parse(req.body);
    const branch = await prisma.branch.update({
      where: { id },
      data,
    });
    res.json(branch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating branch' });
  }
};

export const disableBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.update({
      where: { id },
      data: { active: false },
    });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Error disabling branch' });
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
