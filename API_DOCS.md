# API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

### Login

Authenticates a user and returns a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "cm...123",
    "name": "Admin User",
    "role": "ADMIN",
    "branchId": null
  }
}
```

---

## Dashboard

### Get Dashboard Stats

Get aggregated statistics for the admin dashboard.

- **URL**: `/reports/dashboard`
- **Method**: `GET`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)

**Success Response (200 OK):**

```json
{
  "totalRevenue": 1500.5,
  "transactionCount": 25,
  "lowStockCount": 3,
  "activeBranches": 2,
  "recentSales": [
    {
      "id": "cm...sale1",
      "total": 120.0,
      "branch": { "name": "Main Branch" },
      "createdAt": "2025-12-28T10:00:00Z"
    }
  ]
}
```

---

## Branches

### List Branches

Get a list of all branches.

- **URL**: `/branches`
- **Method**: `GET`
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
[
  {
    "id": "cm...456",
    "name": "Main Branch",
    "code": "MAIN",
    "address": "123 Main St",
    "active": true,
    "createdAt": "2025-12-25T12:00:00.000Z"
  }
]
```

### Create Branch

Create a new branch (Admin only).

- **URL**: `/branches`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN)

**Request Body:**

```json
{
  "name": "Downtown Branch",
  "code": "DTWN",
  "address": "456 Market St"
}
```

### Update Branch

Update an existing branch.

- **URL**: `/branches/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (Role: ADMIN)

### Disable Branch

Toggle branch active status.

- **URL**: `/branches/:id/disable`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN)

### List Branch Terminals

Get all terminals associated with a specific branch.

- **URL**: `/branches/:id/terminals`
- **Method**: `GET`
- **Auth Required**: Yes

---

## Users

### List Users

Get a list of all users.

- **URL**: `/users`
- **Method**: `GET`
- **Auth Required**: Yes (Role: ADMIN)

### Create User

Create a new user.

- **URL**: `/users`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN)

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CASHIER", // ADMIN, MANAGER, CASHIER
  "branchId": "cm...456" // Required for non-ADMIN
}
```

### Update User

Update a user's details.

- **URL**: `/users/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (Role: ADMIN)

### Disable User

Toggle user active status.

- **URL**: `/users/:id/disable`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN)

---

## Products

### List Products

Get a list of all products including their SKUs.

- **URL**: `/products`
- **Method**: `GET`
- **Auth Required**: Yes

### Create Product

Create a new product (Admin/Manager only).

- **URL**: `/products`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)

**Request Body:**

```json
{
  "sku": "PROD-002",
  "name": "New Item",
  "price": 50.0,
  "description": "Optional description",
  "categoryId": "cm...cat" // Optional
}
```

---

## Inventory

### Adjust Inventory

Manually adjust stock levels (add/remove) with a reason.

- **URL**: `/inventory/adjust`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body:**

```json
{
  "skuId": "cm...def",
  "branchId": "cm...456",
  "qtyChange": 10, // Positive to add, negative to remove
  "reason": "RESTOCK" // Enum: RESTOCK, DAMAGE, RECOUNT, TRANSFER, CORRECTION
}
```

### Get Low Stock

Get items where quantity is below threshold.

- **URL**: `/inventory/low-stock`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**: `branchId` (optional)

### Get Stock Levels

Get current stock of all items.

- **URL**: `/inventory/levels`
- **Method**: `GET`
- **Auth Required**: Yes

### Inventory History

Get stock movement history.

- **URL**: `/inventory/history`
- **Method**: `GET`
- **Auth Required**: Yes

---

## Reports

### Sales Report

Get aggregated sales data.

- **URL**: `/reports/sales`
- **Method**: `GET`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)
- **Query Parameters**:
  - `from`: Start date (YYYY-MM-DD)
  - `to`: End date (YYYY-MM-DD)
  - `branchId`: Optional filter

### Inventory Report

Get inventory valuation data.

- **URL**: `/reports/inventory`
- **Method**: `GET`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)

---

## Sales

### Get Sales History

Retrieve a list of past sales.

- **URL**: `/sales`
- **Method**: `GET`
- **Auth Required**: Yes

### Create Sale

Process a new sale.

- **URL**: `/sales`
- **Method**: `POST`
- **Auth Required**: Yes

### Refund Sale

Refund a sale.

- **URL**: `/sales/:id/refund`
- **Method**: `POST`
- **Auth Required**: Yes

---

## Cash Management

### Get Active Session

- **URL**: `/cash/session`

### Start Session

- **URL**: `/cash/session/start`

### End Session

- **URL**: `/cash/session/end`

### Add Transaction

- **URL**: `/cash/transaction`
