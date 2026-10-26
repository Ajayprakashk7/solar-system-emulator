## 2026-10-26 - Fix vulnerable dependencies
**Vulnerability:** Critical vulnerabilities in `next` and high in `zod` found via `npm audit`.
**Learning:** We must not use `npm audit fix --force` as it causes breaking upgrades. We need to manually identify and update packages like `next@16.4.3` and `zod@^4.6.7`, and properly address breaking changes like Zod's `errorMap` and `ZodError.errors` -> `.issues`.
**Prevention:** Regularly check `npm audit` and perform targeted updates, fixing code incompatibilities locally.
