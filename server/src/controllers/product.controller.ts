import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const createProductSchema = z.object({
  sku: z.string(),
  name: z.string(),
  price: z.number().positive(),
  description: z.string().optional(),
});

const updateProductSchema = z.object({
  name: z.string().optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { skus: true },
      where: { active: true }, // Default to only showing active? Or show all with status?
      // Usually management UI needs all, POS needs active. 
      // For now, let's return all so admin can see disabled ones.
    });
    // Actually, let's allow filtering by active status if needed, but default to all for now.
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        ...data,
        skus: {
          create: {
            name: data.name, // Default SKU
          }
        }
      },
    });
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating product' });
  }
};

export const disableProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.update({
      where: { id },
      data: { active: false },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error disabling product' });
  }
};
