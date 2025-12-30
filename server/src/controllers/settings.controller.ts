import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { z } from "zod";

// Default settings to ensure they exist
const DEFAULT_SETTINGS = [
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

// Validation Schemas
const createSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  category: z.enum(["general", "profile", "security", "about", "guide"]),
  scope: z.enum(["global", "branch", "user"]).default("global"),
  scopeId: z.string().optional(),
});

const updateSettingSchema = z.object({
  value: z.any(),
});

// Helper function to ensure default settings exist
export const ensureDefaultSettings = async () => {
  for (const setting of DEFAULT_SETTINGS) {
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
    }
  }
};

// Helper function to check if user can access setting category
const canAccessCategory = (userRole: string, category: string, userId: string, settingScope?: string, settingScopeId?: string | null) => {
  // All roles can read about and guide
  if (["about", "guide"].includes(category)) {
    return { canRead: true, canWrite: false };
  }
  
  // All roles can access their own profile and security
  if (["profile", "security"].includes(category)) {
    const canWrite = settingScope === "user" && settingScopeId === userId;
    return { canRead: true, canWrite };
  }
  
  // Only ADMIN can access general settings (both read and write)
  if (category === "general") {
    const isAdmin = userRole === "ADMIN";
    return { canRead: isAdmin, canWrite: isAdmin };
  }
  
  return { canRead: false, canWrite: false };
};

// GET /api/settings
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    // Ensure default settings exist
    await ensureDefaultSettings();
    
    const user = (req as any).user;
    const { category } = req.query;

    let whereClause: any = {};
    
    // Filter by category if specified
    if (category && typeof category === 'string') {
      whereClause.category = category;
    }

    // Get settings based on access rights
    const settings = await (prisma as any).systemSetting.findMany({
      where: whereClause,
      orderBy: [
        { category: "asc" },
        { key: "asc" }
      ]
    });

    // Filter settings based on user access rights
    const filteredSettings = settings.filter((setting: any) => {
      const { canRead } = canAccessCategory(
        user.role,
        setting.category,
        user.id,
        setting.scope,
        setting.scopeId
      );
      return canRead;
    });

    res.json(filteredSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

// GET /api/settings/:category
export const getSettingsByCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { category } = req.params;

    // Validate category
    if (!["general", "profile", "security", "about", "guide"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Check if user has permission to read this category
    const { canRead: categoryCanRead } = canAccessCategory(user.role, category, user.id);
    if (!categoryCanRead) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch settings for this category
    const settings = await (prisma as any).systemSetting.findMany({
      where: {
        category,
        OR: [
          { scope: "global" },
          { scope: "user", scopeId: user.id }
        ]
      },
      orderBy: { key: "asc" }
    });

    // Filter based on detailed access rules
    const filteredSettings = settings.filter((setting: any) => {
      const { canRead } = canAccessCategory(
        user.role,
        category,
        user.id,
        setting.scope,
        setting.scopeId
      );
      return canRead;
    });

    res.json(filteredSettings);
  } catch (error) {
    console.error("Error fetching settings by category:", error);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

// PATCH /api/settings/:key
export const updateSetting = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { key } = req.params;
    const data = updateSettingSchema.parse(req.body);

    // Find the setting
    const setting = await (prisma as any).systemSetting.findFirst({
      where: {
        key,
        OR: [
          { scope: "global" },
          { scope: "user", scopeId: user.id }
        ]
      }
    });

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    // Check write permissions
    const { canWrite } = canAccessCategory(
      user.role,
      setting.category,
      user.id,
      setting.scope,
      setting.scopeId
    );

    if (!canWrite) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update the setting
    const updatedSetting = await (prisma as any).systemSetting.update({
      where: { id: setting.id },
      data: {
        value: data.value,
        updatedBy: user.id
      }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE_SETTING",
        meta: {
          key: setting.key,
          category: setting.category,
          oldValue: setting.value,
          newValue: data.value
        }
      }
    });

    res.json(updatedSetting);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error updating setting:", error);
    res.status(500).json({ message: "Error updating setting" });
  }
};

// POST /api/settings (ADMIN only)
export const createSetting = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = createSettingSchema.parse(req.body);

    // Check write permissions for the category
    const { canWrite } = canAccessCategory(
      user.role,
      data.category,
      user.id,
      data.scope,
      data.scopeId
    );

    if (!canWrite) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if setting already exists
    const existing = await (prisma as any).systemSetting.findFirst({
      where: {
        key: data.key,
        scope: data.scope,
        scopeId: data.scopeId || null
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Setting already exists" });
    }

    const setting = await (prisma as any).systemSetting.create({
      data: {
        ...data,
        updatedBy: user.id,
        scopeId: data.scopeId || null
      }
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE_SETTING",
        meta: {
          key: data.key,
          category: data.category,
          value: data.value
        }
      }
    });

    res.status(201).json(setting);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error creating setting:", error);
    res.status(500).json({ message: "Error creating setting" });
  }
};