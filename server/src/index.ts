import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";

import authRoutes from "./routes/auth.routes";
import branchRoutes from "./routes/branch.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import inventoryRoutes from "./routes/inventory.routes";
import saleRoutes from "./routes/sale.routes";
import reportRoutes from "./routes/report.routes";
import cashRoutes from "./routes/cash.routes";
import managerRoutes from "./routes/manager.routes";
import cashViewRoutes from "./routes/cashView.routes";
import settingsRoutes from "./routes/settings.routes";
import { initializeSocket } from "./socket/socketServer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

// CORS must be first to handle preflight requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

// Security & Parsing Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/cash-view", cashViewRoutes);
app.use("/api/settings", settingsRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Initialize Socket.IO
initializeSocket(server);

// 404 Handler - must come before error handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error type for HTTP errors
interface HttpError extends Error {
  status?: number;
}

// Error Handling Middleware - must be last (4 params required)
app.use(
  (
    err: HttpError,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
      status: err.status || 500,
    });
  }
);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
