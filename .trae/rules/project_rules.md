## 1. Project priorities (strict order)
1. Financial correctness
2. Stock accuracy
3. Offline reliability
4. Checkout speed
5. Maintainability
Lower priorities may never break higher ones.
---
## 2. Domain rules
### Sales
* Sales records are immutable.
* Corrections use refunds only.
* Every sale must reference branch, terminal, and cashier.
### Stock
* Stock updates are transactional.
* Every stock change must have a reason.
* No direct stock edits without audit logs.
### ranches
* Stock is branch-scoped.
* Reports may aggregate across branches.
---
## 3. Offline & sync rules
* POS must function without internet.
* Client generates UUIDs for offline records.
* Server enforces idempotency.
* Server state is authoritative.
* Conflicts must surface to the user.
---
## 4. Security rules
* RBAC is mandatory (ADMIN, MANAGER, CASHIER).
* Cashiers cannot modify products or stock.
* Managers are branch-limited.
* Admins are global.
---
## 5. Agent-specific constraints
### Architect Agent
* Defines schema before APIs.
* APIs before UI.
* No implementation code.
### ackend Agent
* No business logic in controllers.
* All money values stored as integers.
* All writes are idempotent where possible.
### POS / Frontend Agent
* Offline-first for cashier screens.
* Sync failures must not block checkout.
* UI must expose sync state.
### AI / Automation Agent
* Suggestion-only mode for financial actions.
* All AI actions must create audit logs.
### QA Agent
* Focus on race conditions.
* Actively attempt to break stock and sync logic.
---
## 6. Definition of done (project)
A task is done only if:
* Business rules enforced
* Tests cover critical paths
* Offline behavior considered
* No financial side effects untracked
---
## 7. Explicit anti-patterns (project)
* Editing sales records
* Auto-correcting stock
* Client-side stock authority
* Shared mutable state across branches
---
## 8. Agent handoff format (mandatory)
```
INPUT:
EXPECTED OUTPUT:
CONSTRAINTS:
DEPENDENCIES:
```
---
## 9. Validation checklist (run before delivery)
* Does this affect money? If yes, audited?
* Does this affect stock? If yes, transactional?
* Does this work offline?
* Does role access block unauthorized actions?

