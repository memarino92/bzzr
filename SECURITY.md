# Security

The current main branch is the supported version.

Report suspected vulnerabilities through
[GitHub private vulnerability reporting](https://github.com/memarino92/bzzr/security/advisories/new)
when it is enabled. If it is unavailable, open a minimal issue asking the
maintainer for a private reporting channel without publishing exploit details.
Do not include real cookies or participant data.

## Trust boundaries

- A room code is a public invitation, not a password.
- Each participant gets a random 256-bit capability in an HttpOnly, SameSite=Strict,
  room-path cookie (Secure on HTTPS). Only its SHA-256 hash is stored.
- Sharing a link shares no capability. The server looks up the participant and role
  from that capability; client-supplied roles and IDs never grant authority.
- Mutations and WebSocket upgrades require exact Origin equality. JSON bodies and
  WebSocket messages have byte limits and runtime validation.
- HTTP creation/join attempts are limited per edge IP key. Socket commands and
  connections are bounded. These limits mitigate abuse, not distributed attacks.
- CSP uses RedwoodSDK nonces for scripts. No third-party scripts or analytics are
  required. React escapes participant names.
- Only names, current order, capabilities, and room timing are stored. No account,
  email, questions, answers, audio, video, or cross-room history is collected.

Names are visible to anyone who joins with the code. Avoid sensitive names.
Losing a host cookie loses host control; v1 has no recovery or host transfer.
No claim is made of equal network latency or competitive anti-cheat protection.

See [operations](docs/operations.md) for retention, observability, and incident
response. A root MIT license does not change third-party component licenses.
