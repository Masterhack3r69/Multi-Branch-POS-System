# API Documentation

Base URL: `http://localhost:3000/api`

## Common Response Headers

- `Authorization: Bearer <JWT_TOKEN>` (Required for protected routes)

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

## Branches

### List Branches

Get a list of all branches.

- **URL**: `/branches`
- **Method**: `GET`
- **Auth Required**: Yes

### Create Branch

Create a new branch and an initial terminal (Admin only).

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

**Request Body:**

```json
{
  "name": "Updated Name",
  "code": "UPDT",
  "address": "New Address",
  "active": true
}
```

### Disable Branch

Toggle branch active status to false.

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

Get a list of all users with branch details.

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
  "branchId": "cm...456" // Required for non-ADMIN, null for ADMIN
}
```

### Update User

Update a user's details.

- **URL**: `/users/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (Role: ADMIN)

**Request Body:**

```json
{
  "name": "New Name",
  "role": "MANAGER",
  "branchId": "cm...abc",
  "password": "newpassword123" // Optional
}
```

### Toggle User Status

Toggle user active status.

- **URL**: `/users/:id/disable`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN)

**Request Body (Optional):**

```json
{
  "active": true // If provided, sets to this value. Otherwise toggles.
}
```

---

## Products

### List Products

Get a list of all active products including their SKUs.

- **URL**: `/products`
- **Method**: `GET`
- **Auth Required**: Yes

### Create Product

Create a new product and a default SKU (Admin/Manager only).

- **URL**: `/products`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)

**Request Body:**

```json
{
  "sku": "PROD-002",
  "name": "New Item",
  "price": 50.0,
  "description": "Optional description"
}
```

### Update Product

Update product details.

- **URL**: `/products/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)

**Request Body:**

```json
{
  "name": "Updated Name",
  "price": 55.0,
  "description": "New description",
  "active": true
}
```

---

## Inventory

### Adjust Inventory

Manually adjust stock levels with a reason.

- **URL**: `/inventory/adjust`
- **Method**: `POST`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)

**Request Body:**

```json
{
  "skuId": "cm...def",
  "branchId": "cm...456",
  "qtyChange": 10, // Positive to add, negative to remove
  "reason": "RESTOCK" // RESTOCK, DAMAGE, RECOUNT, TRANSFER, CORRECTION
}
```

### Get Stock Levels

Get current stock of all items. Filters by user's branch if not ADMIN.

- **URL**: `/inventory/levels`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `branchId`: Optional (for ADMIN to see specific branch)

### Get Low Stock

Get items where quantity is below threshold.

- **URL**: `/inventory/low-stock`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `branchId`: Optional

### Inventory History

Get stock movement history (Last 100 movements).

- **URL**: `/inventory/history`
- **Method**: `GET`
- **Auth Required**: Yes (Role: ADMIN, MANAGER)
- **Query Parameters**:
  - `skuId`: Optional filter
  - `branchId`: Optional filter

---

## Sales

### Get Sales History

Retrieve a list of past sales (Last 50).

- **URL**: `/sales`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `branchId`: Filter by branch
  - `cashierId`: Filter by cashier
  - `terminalId`: Filter by terminal
  - `from`: Start date (YYYY-MM-DD)
  - `to`: End date (YYYY-MM-DD)

### Create Sale

Process a new sale and update stock levels.

- **URL**: `/sales`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body:**

```json
{
  "branchId": "cm...",
  "terminalId": "cm...",
  "cashierId": "cm...",
  "items": [
    {
      "skuId": "cm...",
      "qty": 2,
      "price": 25.0,
      "discount": 0
    }
  ],
  "payments": [
    {
      "method": "CASH", // CASH, CARD
      "amount": 50.0
    }
  ]
}
```

### Refund Sale

Refund a sale (full or partial).

- **URL**: `/sales/:id/refund`
- **Method**: `POST`
- **Auth Required**: Yes
- **Note**: Cashiers can only refund same-day sales.

**Request Body:**

```json
{
  "items": [
    // Optional, if omitted = full refund
    {
      "skuId": "cm...",
      "qty": 1
    }
  ],
  "reason": "Customer returned"
}
```

---

## Cash Management

### Get Active Session

Get the current active cash session for the logged-in user.

- **URL**: `/cash/session`
- **Method**: `GET`
- **Auth Required**: Yes

### Start Session

Open a new cash session.

- **URL**: `/cash/session/start`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body:**

```json
{
  "branchId": "cm...",
  "terminalId": "cm...",
  "startAmount": 100.0
}
```

### End Session

Close the current active cash session.

- **URL**: `/cash/session/end`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body:**

```json
{
  "endAmount": 150.0
}
```

### Add Transaction

Record a cash movement (Float In, Drop, Payout).

- **URL**: `/cash/transaction`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body:**

```json
{
  "type": "DROP", // FLOAT_IN, DROP, PAYOUT
  "amount": 20.0,
  "reason": "Moving excess cash to safe"
}
```

---

## Reports (Admin/Manager Only)

### Dashboard Stats

Get aggregated statistics for the dashboard.

- **URL**: `/reports/dashboard`
- **Method**: `GET`
- **Auth Required**: Yes

### Sales Report

Get aggregated sales data with breakdown.

- **URL**: `/reports/sales`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `from`: Start date
  - `to`: End date
  - `branchId`: Filter by branch
  - `groupBy`: 'branch' or 'user' (default: 'branch')

### Inventory Report

Get inventory valuation data.

- **URL**: `/reports/inventory`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `branchId`: Filter by branch
