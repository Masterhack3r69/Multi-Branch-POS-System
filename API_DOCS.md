# API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

### Login
Authenticates a user and returns a JWT token.

*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Auth Required**: No

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

*   **URL**: `/branches`
*   **Method**: `GET`
*   **Auth Required**: Yes

**Success Response (200 OK):**
```json
[
  {
    "id": "cm...456",
    "name": "Main Branch",
    "code": "MAIN",
    "address": "123 Main St",
    "createdAt": "2025-12-25T12:00:00.000Z",
    "updatedAt": "2025-12-25T12:00:00.000Z"
  }
]
```

### Create Branch
Create a new branch (Admin only).

*   **URL**: `/branches`
*   **Method**: `POST`
*   **Auth Required**: Yes (Role: ADMIN)

**Request Body:**
```json
{
  "name": "Downtown Branch",
  "code": "DTWN",
  "address": "456 Market St"
}
```

### List Branch Terminals
Get all terminals associated with a specific branch.

*   **URL**: `/branches/:id/terminals`
*   **Method**: `GET`
*   **Auth Required**: Yes

**Success Response (200 OK):**
```json
[
  {
    "id": "cm...789",
    "branchId": "cm...456",
    "name": "Terminal 1",
    "active": true
  }
]
```

---

## Products

### List Products
Get a list of all products including their SKUs.

*   **URL**: `/products`
*   **Method**: `GET`
*   **Auth Required**: Yes

**Success Response (200 OK):**
```json
[
  {
    "id": "cm...abc",
    "sku": "PROD-001",
    "name": "Sample Product",
    "description": null,
    "price": 100,
    "skus": [
      {
        "id": "cm...def",
        "productId": "cm...abc",
        "barcode": "1234567890123",
        "name": "Sample Product Standard"
      }
    ]
  }
]
```

### Create Product
Create a new product (Admin/Manager only).

*   **URL**: `/products`
*   **Method**: `POST`
*   **Auth Required**: Yes (Role: ADMIN, MANAGER)

**Request Body:**
```json
{
  "sku": "PROD-002",
  "name": "New Item",
  "price": 50.0,
  "description": "Optional description"
}
```

---

## Inventory

### Adjust Inventory
Manually adjust stock levels (add/remove) with a reason.

*   **URL**: `/inventory/adjust`
*   **Method**: `POST`
*   **Auth Required**: Yes

**Request Body:**
```json
{
  "skuId": "cm...def",
  "branchId": "cm...456",
  "qty": 10, // Positive to add, negative to remove
  "reason": "Restock"
}
```

**Success Response (200 OK):**
```json
{
  "id": "cm...stock1",
  "skuId": "cm...def",
  "branchId": "cm...456",
  "qty": 100,
  "lowStockThreshold": 10,
  "updatedAt": "2025-12-26T12:00:00.000Z"
}
```

### Inventory History
Get stock movement history, optionally filtered by SKU and Branch.

*   **URL**: `/inventory/history`
*   **Method**: `GET`
*   **Auth Required**: Yes
*   **Query Parameters**:
    *   `skuId` (optional)
    *   `branchId` (optional)

**Success Response (200 OK):**
```json
[
  {
    "id": "cm...move1",
    "type": "ADJUSTMENT",
    "qty": 10,
    "reason": "Restock",
    "createdAt": "2025-12-26T12:00:00.000Z",
    "sku": { "name": "Sample Product Standard" },
    "branch": { "name": "Main Branch" },
    "user": { "name": "Admin User" }
  }
]
```

---

## Sales

### Get Sales History
Retrieve a list of past sales.

*   **URL**: `/sales`
*   **Method**: `GET`
*   **Auth Required**: Yes
*   **Query Parameters**:
    *   `branchId` (optional): Filter by branch

**Success Response (200 OK):**
```json
[
  {
    "id": "cm...sale1",
    "total": 110,
    "tax": 10,
    "createdAt": "2025-12-25T12:05:00.000Z",
    "items": [...],
    "payments": [...],
    "refunds": [...]
  }
]
```

### Create Sale
Process a new sale. This endpoint is transactional: it creates the sale record, records payments, and decrements stock. It supports idempotency via `clientSaleId`.

*   **URL**: `/sales`
*   **Method**: `POST`
*   **Auth Required**: Yes

**Request Body:**
```json
{
  "clientSaleId": "uuid-v4-from-client", 
  "branchId": "cm...456",
  "terminalId": "cm...789",
  "cashierId": "cm...123",
  "items": [
    {
      "skuId": "cm...def",
      "qty": 1,
      "price": 100,
      "discount": 0
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "amount": 110
    }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "id": "cm...sale1",
  "branchId": "cm...456",
  "total": 110,
  "tax": 10,
  "createdAt": "2025-12-25T12:05:00.000Z",
  "items": [...],
  "payments": [...]
}
```

### Refund Sale
Refund a sale, either fully or partially. Restocks items and creates a refund record.

*   **URL**: `/sales/:id/refund`
*   **Method**: `POST`
*   **Auth Required**: Yes
    *   **Cashiers**: Can only refund same-day sales.
    *   **Managers/Admins**: Can refund any sale.

**Request Body (Partial Refund):**
```json
{
  "items": [
    {
      "skuId": "cm...def",
      "qty": 1
    }
  ],
  "reason": "Customer returned item"
}
```

**Request Body (Full Refund):**
```json
{
  "reason": "Accidental charge"
}
```

**Success Response (200 OK):**
```json
{
  "id": "cm...refund1",
  "saleId": "cm...sale1",
  "amount": 110,
  "reason": "Customer returned item",
  "createdAt": "2025-12-26T14:00:00.000Z",
  "items": [...]
}
```

---

## Error Responses

*   **400 Bad Request**: Validation error (e.g., missing fields, invalid quantity).
*   **401 Unauthorized**: Missing or invalid JWT token.
*   **403 Forbidden**: User does not have the required role (e.g., cashier trying to refund old sale).
*   **404 Not Found**: Resource not found (e.g., sale ID invalid).
*   **500 Internal Server Error**: Unexpected server error.
