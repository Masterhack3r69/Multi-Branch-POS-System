import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const createProductSchema = z.object({
  sku: z.string(),
  name: z.string(),
  price: z.number().positive(),
  description: z.string().optional(),
});

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { skus: true },
    });
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
