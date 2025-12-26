Yes — that was the right call.
What you want now is **one clean, merged execution plan**, not separate phases that slow you down.

Below is a **combined phase roadmap** that keeps things practical and buildable, without overengineering.

---

## Combined Execution Phases (Clean & Realistic)

Instead of:

* Stability
* Control
* Expansion

We merge them into **3 real phases** that map to how POS systems are actually built.

---

## Phase 1 — Core Operations (Do this NOW)

This phase makes the system *usable in a real store*.

### 1. Inventory Management (Highest priority)

Implement fully, not partially.

**Features**

* Stock initialization per branch
* Manual stock adjustment with reason
* Inventory movement history (immutable)
* Low-stock threshold per SKU per branch
* Disable SKU / product (soft delete)

**Tables**

* `inventory_adjustments`
* `inventory_movements` (or reuse with typed events)

**APIs**

```
POST /inventory/adjust
GET  /inventory/history
GET  /inventory/low-stock
```

---

### 2. Product Management

Turn products into something managers can actually manage.

**Features**

* Update product price, name, barcode
* Branch-level availability
* Optional branch-level price override
* Soft delete products

**APIs**

```
PATCH /products/:id
POST  /products/:id/disable
```

---

### 3. Branch Management

Branches need operational settings.

**Features**

* Update branch info
* Enable/disable branch
* Branch tax rate
* Branch opening hours (optional)

**APIs**

```
PATCH /branches/:id
POST  /branches/:id/disable
```

---

### 4. User & Access Management

Prevent chaos early.

**Features**

* Create / edit users
* Assign branch
* Change role
* Disable user
* Force logout on role change

**Rules**

* Cashier → one branch
* Manager → one or more branches
* Admin → global

**APIs**

```
POST  /users
PATCH /users/:id
POST  /users/:id/disable
```

---

## Phase 2 — Sales Integrity & Cash Control

This protects money and daily operations.

### 5. Refunds & Voids

* Full and partial refunds
* Stock reversal
* Refund reason required
* Role limits

```
POST /sales/:id/refund
```

---

### 6. Cash Sessions

Every terminal must track cash.

**Features**

* Open drawer
* Close drawer
* Variance calculation
* Cashier daily summary

**Tables**

* `cash_sessions`
* `cash_movements`

**APIs**

```
POST /cash/open
POST /cash/close
GET  /cash/summary
```

---

### 7. Audit Logs

Track sensitive actions.

**Log**

* stock changes
* refunds
* price edits
* role changes

---

## Phase 3 — Visibility, Sync Safety, and Growth

This is where confidence comes from.

### 8. Reporting

Only now reports make sense.

**Reports**

* Daily sales per branch
* Sales per cashier
* Top products
* Refund totals
* Cash variance

```
GET /reports/daily
GET /reports/cashiers
```

---

### 9. Offline Sync Hardening

You already have offline; now make it safe.

**Add**

* Sync error table
* Retry logic
* Visible sync queue
* Manager resolution for failed sales

---

### 10. Optional Growth Features

Do these only if needed.

* Promotions
* Branch transfers
* Supplier tracking
* Purchase orders
* Card payment integration

---

## Execution Order (No Confusion)

**Next 3 sprints**

### Sprint 1

* Inventory adjustments
* Inventory history
* Product update/disable
* Branch update/disable

### Sprint 2

* User management
* Refunds
* Cash open/close
* Audit logs

### Sprint 3

* Reports
* Sync hardening
* Manager dashboards

---

## Why this combined plan works

* No duplicated work
* No dead features
* Inventory is correct before reports
* Cash is controlled before audits
* Offline sync is hardened before scale

This is the same order used by real retail POS systems.
