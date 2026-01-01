import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod"; // Assuming zod is used for validation

// Validation Schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
  branchId: z.string().optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).optional(),
  branchId: z.string().optional().nullable(),
  password: z.string().min(6).optional(), // Optional password update
});

// Controllers

// GET /users
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        active: true,
        createdAt: true,
        branch: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// POST /users
export const createUser = async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Handle empty string for branchId
    if (data.branchId === "") {
      data.branchId = null;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        active: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

// PATCH /users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Build update object with proper types
    const updateData: {
      name?: string;
      role?: "ADMIN" | "MANAGER" | "CASHIER";
      branchId?: string | null;
      password?: string;
    } = { ...data };

    // Handle empty string for branchId
    if (updateData.branchId === "") {
      updateData.branchId = null;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        active: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};

// POST /users/:id/disable (Toggle active status)
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body; // Expect explicit state or toggle? Let's check impl plan.

    // If body has 'active' boolean, use it. Otherwise toggle.
    // Simplifying: Let's fetch current and toggle.

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    const newStatus =
      typeof active === "boolean" ? active : !currentUser.active;

    const user = await prisma.user.update({
      where: { id },
      data: { active: newStatus },
      select: { id: true, active: true },
    });

    res.json(user);
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Error updating user status" });
  }
};

