
### Priorities (never violated)

1. Financial correctness
2. Stock accuracy
3. Offline reliability

---

### Sales

* Sales are immutable.
* Corrections use refunds only.
* Every sale references branch, terminal, cashier.

---

### Stock

* Stock is branch-scoped.
* All stock changes are transactional.
* Every stock change requires a reason and audit log.
* No direct stock edits.

---

### Offline & Sync

* POS must work offline.
* Client generates UUIDs.
* Server is authoritative.
* Idempotent writes required.
* Sync conflicts must be shown to the user.
### Security
* RBAC enforced: ADMIN, MANAGER, CASHIER.
* Cashiers: sales only.
* Managers: branch-limited.
* Admins: global.
### AI Usage
* Suggestion-only.
* No direct money or stock changes.
* All AI actions must be audited.
### Definition of Done
* Rules enforced
* Money and stock fully audited
* Offline behavior verified
