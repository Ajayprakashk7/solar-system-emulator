## 2025-02-28 - Dependency Hallucination and Scope Discipline
**Vulnerability:** Updating core dependencies to resolve automated audit tools without verifying target versions.
**Learning:** Tools like `npm audit fix --force` or manual major dependency updates often hallucinate non-existent versions or introduce severe breaking changes that crash CI pipelines.
**Prevention:** Never upgrade major dependencies blindly to resolve audit failures, especially when acting under a scoped persona.
