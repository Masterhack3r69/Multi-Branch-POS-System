# Multi-Branch POS — Technical specification & MVP

## 1. Overview

A web-based Point of Sale system that supports multiple branches with centralized product catalog, per-branch stock levels, real-time sales sync, role-based access, reporting, and offline-capable cashier terminals. The document defines the technical architecture, data model, API surface, frontend screens, deployment plan, and a minimal viable product (MVP) feature set.

---

## 2. Goals

* Provide a fast, reliable POS for checkout and returns at each branch.
* Keep inventory consistent across branches while allowing branch-specific stock counts.
* Allow managers to view consolidated and per-branch reports.
* Support offline operation for cashier terminals with automatic synchronization when online.
* Be maintainable and extensible.

---

## 3. Assumptions

* Each branch has one or more cashier terminals (browsers or tablets).
* Network may be unreliable; offline-first capability is required for checkout.
* Payment provider integration is optional for the MVP — card payments can be processed externally.
* The first MVP focuses on core workflows: sales, inventory, returns, basic reports, users/roles, branch management.

---

## 4. Non-functional requirements

* Security: TLS everywhere, RBAC, audit logs for sensitive actions.
* Performance: Real-time updates for stock and sales via websockets; single-page frontend is responsive.
* Scalability: Design with horizontal scaling in mind (stateless API servers, central DB, Redis for ephemeral state).
* Reliability: Local persistence at terminals (IndexedDB) to survive network loss.

---

## 5. High-level architecture

```
[Browser / POS Terminal (PWA)] <-> [API Gateway / Backend (Node.js)] <-> [Postgres]
                              \-> Redis (cache, pub/sub)
                              \-> Worker queue (optional) for background jobs

Admin UI (web) <-> API
Reporting / BI <- read replica of Postgres or analytics export
```

Key pieces:

* Frontend: React + TypeScript, PWA with service worker and IndexedDB sync store.
* Backend: Node.js with NestJS or Express + TypeScript, REST + WebSocket (Socket.IO or ws).
* Database: PostgreSQL for relational data.
* Cache & Pub/Sub: Redis for cache and real-time pub/sub across instances.
* ORM: Prisma (recommended) or TypeORM.
* DevOps: Docker for local development, Docker Compose for compose stacks, deploy to cloud (managed DB), optional Kubernetes for production.

---

## 6. Tech stack (recommended)

* Frontend: React, TypeScript, Vite or Next.js (app router optional), Tailwind CSS.
* State: Zustand or Redux Toolkit.
* Offline storage: IndexedDB via idb library.
* Backend: Node.js, TypeScript, NestJS or Express.
* ORM: Prisma + PostgreSQL.
* Real-time: Socket.IO or native WebSocket.
* Queue/Workers: BullMQ (Redis) for jobs like report export and sync conflict resolution.
* Auth: JWT access + refresh tokens (HTTP-only cookies for refresh), role-based checks.
* Logging & Monitoring: Winston or Pino, Sentry for errors, Prometheus + Grafana for metrics.
* CI/CD: GitHub Actions (build, test, lint, docker build, push), deploy to Cloud Run / ECS / droplet.

---

## 7. Data model (Prisma-like schema)

```prisma
model Branch {
  id        String   @id @default(cuid())
  name      String
  address   String?
  code      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  terminals Terminal[]
  stocks    Stock[]
}

model Terminal {
  id        String   @id @default(cuid())
  branchId  String
  name      String
  active    Boolean  @default(true)
  branch    Branch   @relation(fields: [branchId], references: [id])
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(CASHIER)
  branchId  String?
  branch    Branch?  @relation(fields: [branchId], references: [id])
  createdAt DateTime @default(now())
}

enum Role { ADMIN MANAGER CASHIER }

model Product {
  id          String   @id @default(cuid())
  sku         String   @unique
  name        String
  description String?
  price       Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  skus        SKU[]
}

model SKU {
  id        String   @id @default(cuid())
  productId String
  barcode   String?  @unique
  name      String?
  createdAt DateTime @default(now())
  product   Product  @relation(fields: [productId], references: [id])
  stocks    Stock[]
}

model Stock {
  id       String  @id @default(cuid())
  skuId    String
  branchId String
  qty      Int     @default(0)
  sku      SKU     @relation(fields: [skuId], references: [id])
  branch   Branch  @relation(fields: [branchId], references: [id])
  updatedAt DateTime @updatedAt
}

model Sale {
  id           String    @id @default(cuid())
  branchId     String
  terminalId   String
  cashierId    String
  total        Float
  tax          Float
  createdAt    DateTime  @default(now())
  items        SaleItem[]
  payments     Payment[]
}

model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  skuId     String
  qty       Int
  price     Float
  discount  Float?  @default(0)
  sale      Sale    @relation(fields: [saleId], references: [id])
}

model Payment {
  id        String  @id @default(cuid())
  saleId    String
  method    String
  amount    Float
  provider  String?
}

model Refund {
  id        String  @id @default(cuid())
  saleId    String
  amount    Float
  reason    String?
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String  @id @default(cuid())
  actorId   String?
  action    String
  meta      Json?
  createdAt DateTime @default(now())
}
```

Notes: stock changes should be recorded in audit or stock history table for traceability. Consider an InventoryAdjustment model for manual adjustments.

---

## 8. Key API endpoints (REST)

### Auth

* `POST /api/auth/login` — body: `{ email, password }` -> returns `{ accessToken }`.
* `POST /api/auth/refresh` — refresh token cookie -> returns new access token.
* `POST /api/auth/logout` — revoke refresh token.

### Branches & Terminals

* `GET /api/branches` — list branches.
* `POST /api/branches` — create branch (admin).
* `GET /api/branches/:id/terminals` — list terminals for branch.

### Products & Inventory

* `GET /api/products` — search products.
* `POST /api/products` — create product.
* `GET /api/skus/:id/stock?branchId=` — get stock for sku.
* `POST /api/stocks/adjust` — adjust stock (manual), records audit.

### Sales

* `POST /api/sales` — create a sale. Body includes branchId, terminalId, cashierId, items, payments. If offline, client may mark as `pendingSync` and server will accept idempotent creation.
* `GET /api/sales/:id` — get sale details.
* `POST /api/sales/:id/refund` — create refund.

### Reports

* `GET /api/reports/sales?branchId=&from=&to=` — consolidated or per-branch sales.
* `GET /api/reports/inventory?branchId=` — low stock, stock value.

### Realtime

* WebSocket channel for `stock-updates` and `sale-created` per branch.

Security: enforce RBAC on each endpoint.

---

## 9. Client offline & sync strategy

* The POS should be a PWA that caches assets and stores sales in IndexedDB while offline.
* Each local sale is queued with a local UUID. When network returns, the client sends queued sales to `/api/sales`.
* Server endpoints are idempotent: if a sale with same client-provided `clientSaleId` already exists, server returns existing record.
* Conflict resolution: server wins on stock authoritative values; client re-sync will reconcile differences and show errors to cashier if sale cannot be completed.
* Use background sync (service worker) to attempt retries.

---

## 10. UI/UX: screens and flows

### Cashier terminal (primary POS)

* Login (terminal login with cashier account).
* Product search by name, sku, or barcode scanner input.
* Cart view: items, qty edit, discounts, tax, totals.
* Payments: choose method, record payment.
* Complete sale -> print receipt / show QR code.
* Refunds: process by scanning receipt or sale id.
* Offline indicator and sync status.

### Manager dashboard (web)

* Branch list and switching.
* Sales dashboard: daily totals, top products, payments breakdown.
* Inventory: product list, per-branch stock, low-stock alerts.
* Users: manage users, roles, terminals.

### Admin

* Company settings, tax rates, payment provider config.
* Audit logs and data export.

---

## 11. Security

* Transport: TLS for API and frontend.
* Auth: strong password hashing (bcrypt/argon2), JWT for API access, HTTP-only secure refresh token cookie.
* RBAC: role checks (ADMIN, MANAGER, CASHIER).
* Input validation & parameterized queries (ORM prevents injection).
* Audit logs for sale, refund, stock change, user changes.
* Rate limiting on auth endpoints.

---

## 12. Testing

* Unit tests for business logic (stock decrement, sale totals).
* Integration tests for critical API flows (sale creation, stock adjust).
* End-to-end tests for POS checkout flow (Cypress / Playwright).
* Load testing on sales endpoint to validate concurrency behavior.

---

## 13. Deployment & infra

* Containerize app with Docker.
* Use managed Postgres (Cloud SQL, RDS, or Supabase) for reliability.
* Use Redis (managed) for pub/sub and job queues.
* CI: GitHub Actions pipeline to build, test, and push docker images.
* Deploy options: Cloud Run / ECS / Kubernetes. For small setups, a single Docker Compose on a VPS works for testing.
* Backups: nightly DB backups and on-demand exports.

---

## 14. MVP scope (minimum features to go live)

Core features to implement for MVP:

* Multi-branch model and branch management.
* User authentication and role management.
* POS terminal: product search, cart, checkout, cash payment recording, basic receipt.
* Inventory per branch and stock decrement on sale.
* Offline mode for terminals with IndexedDB queue + sync.
* Basic reports: daily sales per branch, top products.
* Audit logs for sales and stock adjustments.

Not included in MVP (phase 2): integrated card processing, advanced promotions engine, accounting integration, sophisticated BI dashboards.

---

## 15. Deliverables (for initial MVP)

* Source code repo with frontend and backend apps.
* Docker Compose setup for local dev.
* Postgres schema (migrations) and seed data for sample branches/products.
* Basic CI pipeline (build & tests).
* Deployed staging environment (optional depending on hosting preference).
* Documentation: README with setup, API swagger spec, and sync behavior notes.

---

## 16. Next implementation steps (ordered)

1. Scaffold monorepo (or separate repos) and project structure.
2. Implement authentication and RBAC.
3. Implement product & stock models and admin CRUD.
4. Implement sale creation endpoint and stock decrement logic.
5. Build POS frontend: product search, cart, checkout.
6. Add offline queue and sync in the POS client.
7. Add WebSocket hooks for real-time stock updates.
8. Create basic reporting endpoints and dashboards.
9. Testing, hardening, and deployment scripts.

---

## 17. Open decisions / tradeoffs

* ORM: Prisma simplifies migrations and types; TypeORM is more traditional. Choose Prisma for developer ergonomics.
* Real-time: Socket.IO is easy to integrate; native WebSocket is lighter. Choose Socket.IO if you need room for reconnect logic and rooms.
* Offline conflict handling: server authoritative model is simpler but requires clear cashier messaging on failed syncs.

---

## 18. Appendix: sample API payloads

**Create sale request (client-side):**

```json
POST /api/sales
{
  "clientSaleId": "local-uuid-123",
  "branchId": "branch-abc",
  "terminalId": "term-1",
  "cashierId": "user-1",
  "items": [
    { "skuId": "sku-1", "qty": 2, "price": 50.0 },
    { "skuId": "sku-2", "qty": 1, "price": 30.0 }
  ],
  "payments": [ { "method": "CASH", "amount": 130.0 } ]
}
```

**Server response (created):**

```json
{ "id": "sale-remote-567", "status": "OK", "createdAt": "2025-12-01T10:00:00Z" }
```

---

If you want, I can also generate:

* a ready-to-run monorepo scaffold (frontend + backend) in a single file layout,
* Prisma schema + initial migrations,
* example React POS terminal page (single-file React component) with IndexedDB sync logic.

Open to continuing: pick one of the items above and I will produce the code scaffold or a focused artifact next.
