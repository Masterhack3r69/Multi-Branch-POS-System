import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getAllSettings,
  getSettingsByCategory,
  updateSetting,
  createSetting
} from "../controllers/settings.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/settings - Get all settings (filtered by user role)
router.get("/", getAllSettings);

// GET /api/settings/:category - Get settings by category
router.get("/:category", getSettingsByCategory);

// PATCH /api/settings/:key - Update a specific setting
router.patch("/:key", updateSetting);

// POST /api/settings - Create new setting (ADMIN only for most categories)
router.post("/", authorize(["ADMIN"]), createSetting);

export default router;