These are **important but fixable**.

---

## 1. Inventory Adjust API (minor issue)

### Current

```json
POST /inventory/adjust
{
  "skuId": "...",
  "branchId": "...",
  "qty": 10,
  "reason": "Restock"
}
```

### Issue

* `qty` is ambiguous (absolute vs delta)
* Reason is free text only

### Recommended (small fix)

Rename `qty` → `qtyChange`

```json
{
  "skuId": "...",
  "branchId": "...",
  "qtyChange": 10,
  "reason": "RESTOCK"
}
```

Also define allowed reasons:

* RESTOCK
* DAMAGE
* RECOUNT
* TRANSFER
* CORRECTION

Why this matters:

* Prevents mistakes
* Makes reports accurate
* Helps audits later

---

## 2. Inventory History (missing type clarity)

### Current response

```json
{
  "type": "ADJUSTMENT",
  "qty": 10,
  "reason": "Restock"
}
```

### Missing

You’ll need **more types** soon:

* SALE
* REFUND
* ADJUSTMENT
* SYNC_CORRECTION

Recommendation:

```ts
type InventoryMovementType =
  | "SALE"
  | "REFUND"
  | "ADJUSTMENT"
  | "SYNC_CORRECTION";
```

No API change needed now — just future-proof it.

---

## 3. Sales History Endpoint (missing filters)

### Current

```
GET /sales?branchId=
```

You will need **very soon**:

* date range
* cashierId
* terminalId

Suggested (non-breaking):

```
GET /sales?branchId=&from=&to=&cashierId=
```

This aligns with the reporting phase.

---

## 4. Refund Endpoint (almost perfect)

Your refund logic is correct.

One missing detail:

* Refund should log **inventory movement per item**

You already restock — just ensure:

* Each refunded item creates an inventory movement
* Movement type = `REFUND`

This aligns with the inventory plan.
