# DROPi Security Baseline — T1

This document records repository-enforced controls for the canonical T1 security module. It does not convert infrastructure assumptions into compliance claims.

## Repository-enforced controls

- **T1.1 — AES-256 at rest:** application-managed webhook signing secrets use versioned AES-256-GCM envelopes. New writes require a deployment keyring; legacy plaintext secrets are rewrapped on use when the keyring is configured.
- **T1.2 — encryption in transit:** production application traffic is HTTPS-only at the application boundary and HSTS is emitted. The Node process is behind the public ingress and therefore cannot independently attest the external TLS protocol version.
- **T1.3 — rate limiting:** global IP-based API throttling is applied before route execution; B2B API keys retain their per-key limits.
- **T1.4 — input sanitization:** request bodies are bounded and structurally checked against prototype-pollution keys/excessive nesting; user-facing text/URL helpers normalize and bound values.
- **T1.5 — SQL injection prevention:** runtime persistence uses Drizzle parameter binding; security contracts reject raw-SQL escape hatches on high-risk surfaces.
- **T1.6 — XSS prevention:** the API emits restrictive CSP, frame denial, no-sniff and referrer controls; the server does not render user HTML.
- **T1.7 — secure key management:** `DROPI_DATA_ENCRYPTION_ACTIVE_KEY_ID` identifies the active write key and `DROPI_DATA_ENCRYPTION_KEYS` contains a JSON keyring of 32-byte base64/base64url keys. Old keys remain decrypt-only during rotation. Secrets must live in the deployment secret store, never in repository files or logs.

## Deployment requirements that must be verified separately

1. The public ingress must enforce the canonical minimum **TLS 1.3**. HTTPS-only application enforcement is not evidence of the negotiated TLS version.
2. The database/volume provider must provide evidence of **AES-256 encryption at rest** for storage not protected by application-level envelopes.
3. Production must configure the DROPi data-encryption keyring before new encrypted-secret writes are used.

Until those deployment facts are evidenced, this repository must not claim complete T1.1/T1.2 infrastructure compliance.
