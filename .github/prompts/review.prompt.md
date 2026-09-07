---
description: Review a bzzr change for correctness and operational impact
---

Review the diff against AGENTS.md and the protocol documentation. Trace an
untrusted request through validation, authentication, authority checks, state
mutation, persistence, and broadcast. Check stale rounds, retries, disconnections,
hibernation, and cleanup. Inspect test assertions for meaningful behavior. Report
actionable defects with file locations and a reproducible scenario. Distinguish
verified findings from hypotheses. Do not alter the read-only Catalyst source kit.
