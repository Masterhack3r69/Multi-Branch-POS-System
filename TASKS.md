# Project Tasks & Roadmap

## Phase 1: Core Operations (Complete)

- [x] **Database Schema**: Models for User, Branch, Product, SKU, Stock, Sale.
- [x] **Authentication**: JWT-based auth with RBAC (Admin, Manager, Cashier).
- [x] **User Management**: Admin interface to create/edit/disable users.
- [x] **Branch Management**: Admin interface to create/manage branches and terminals.
- [x] **Inventory Management**:
  - [x] Stock Adjustments (Restock, Damage, etc.)
  - [x] Low Stock Reporting
  - [x] Real-time Stock Levels
- [x] **POS Terminal (Basic)**:
  - [x] Product Search & Cart
  - [x] Offline Support (queue sales)
  - [x] Stock Visibility on Terminal
  - [x] Branch-Specific Data Isolation

## Phase 2: Sales Integrity (Next)

- [ ] **Refunds**:
  - [ ] Partial refunds
  - [ ] Time-limited cashier refunds (same-day only)
  - [ ] Refund validation (cannot refund > sold)
- [ ] **Cash Management**:
  - [ ] Opening/Closing Cash Drawer sessions
  - [ ] Cash Drop/Payout tracking
  - [ ] Day-end reconciliation reporting

## Phase 3: Reporting & Analytics

- [ ] **Sales Reports**: Daily/Monthly sales per branch/user.
- [ ] **Inventory Reports**: Valuation, Turnover rate.
- [ ] **Audit Logs**: Track critical actions (price changes, user edits).

## Phase 4: Reliability & Scale

- [ ] **Offline Hardening**: Robust sync conflict resolution.
- [ ] **Performance**: Pagination for large lists (Sales, Logs).
- [ ] **Testing**: Comprehensive Unit and E2E tests.
