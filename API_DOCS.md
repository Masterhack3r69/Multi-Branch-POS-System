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

## Sales

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

---

## Error Responses

*   **400 Bad Request**: Validation error (e.g., missing fields).
*   **401 Unauthorized**: Missing or invalid JWT token.
*   **403 Forbidden**: User does not have the required role.
*   **500 Internal Server Error**: Unexpected server error.
