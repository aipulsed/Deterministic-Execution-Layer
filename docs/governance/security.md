# Security

This document describes the security model of the Deterministic Execution Layer (DEL), including secrets management, encryption, hashing, JWT handling, and the vulnerability reporting process.

## Secrets management

### Environment variables

All secrets are stored in environment variables and loaded from the `.env` file in local development. In production, use a dedicated secrets manager:

- **AWS** — AWS Secrets Manager or AWS Systems Manager Parameter Store
- **GCP** — Google Cloud Secret Manager
- **On-prem / self-hosted** — HashiCorp Vault or equivalent

**Never commit secrets to source control.** The `.gitignore` file excludes `.env` by default. If a secret is accidentally committed, treat it as compromised immediately: rotate it and audit access logs.

### Secret inventory

| Secret | Environment variable | Required | Rotation guidance |
|--------|---------------------|----------|------------------|
| Database password | `DATABASE_URL` (embedded) | Yes | Rotate every 90 days or on staff changes |
| Redis password | `REDIS_URL` (embedded) | If enabled | Rotate every 90 days |
| AWS credentials | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | If using S3 | Use short-lived credentials via IAM roles in production |
| GCS credentials | `GCS_PROJECT_ID` + service account key | If using GCS | Use Workload Identity in production |
| SMTP password | `SMTP_PASS` | If using email | Rotate every 90 days |
| JWT signing secret | `JWT_SECRET` | Yes | Rotate on suspected compromise; plan for token invalidation |
| Encryption key | `ENCRYPTION_KEY` | Yes | Rotate with a key migration procedure; old data must be re-encrypted |

### Principle of least privilege

- Database users should have only the permissions required by DEL (`SELECT`, `INSERT`, `UPDATE`, `DELETE` on DEL tables; no `DROP TABLE`, no superuser).
- S3/GCS service accounts should have only `GetObject`, `PutObject`, `DeleteObject`, and `ListBucket` on the DEL bucket.
- SMTP credentials should be for a dedicated transactional email account, not a personal account.

---

## Encryption

### At-rest encryption (AES-256-GCM)

Sensitive data stored in the database or on disk is encrypted using AES-256-GCM via the `crypto` service.

**Algorithm:** AES-256-GCM
- 256-bit (32-byte) key
- 128-bit authentication tag (detects tampering)
- Unique 96-bit IV (initialization vector) per encryption operation

Because GCM mode provides _authenticated_ encryption, any tampering with ciphertext or authentication tag is detected and rejected before decryption.

**Key configuration:** Set `ENCRYPTION_KEY` to a 32-byte (256-bit) random value:

```bash
# Generate a secure 32-byte key (base64-encoded for readability)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Key rotation:** Rotating `ENCRYPTION_KEY` requires:
1. Decrypting all existing encrypted data with the old key.
2. Re-encrypting with the new key.
3. Deploying the new key.

Plan key rotation carefully to avoid data loss. A migration script should be used, not a manual process.

### In-transit encryption (TLS)

- All HTTPS API endpoints must be served over TLS 1.2 or higher in production.
- Database connections should use SSL (`database.ssl: true` in `defaultConfig.json`) in production.
- SMTP connections should use STARTTLS (`SMTP_PORT=587`) or direct SSL (`SMTP_PORT=465`) in production.

---

## Password hashing (bcrypt)

User passwords are never stored in plaintext. DEL uses **bcrypt** (via the `crypto` service) to hash passwords before database storage.

**Algorithm:** bcrypt with a configurable work factor (cost).

**Work factor guidance:**
- Development: cost 10 (fast)
- Production: cost 12–14 (tuned to achieve ~100–300 ms per hash on the target hardware)

**Never** use MD5, SHA-1, or unsalted SHA-256 for password storage. These are not password hashing algorithms.

---

## JWT authentication

DEL uses JSON Web Tokens (JWTs) for API authentication via the `crypto` service.

**Default algorithm:** HS256 (HMAC-SHA-256)

**Security requirements:**

- `JWT_SECRET` must be a strong random string (minimum 32 characters; 64+ recommended for production).
- JWTs must include an `exp` (expiration) claim. Short-lived tokens (15 minutes to 1 hour) are recommended.
- On logout or token compromise, implement token revocation (blocklist in Redis or database).
- For multi-service architectures, prefer RS256 (asymmetric) over HS256 to avoid sharing the signing secret.

---

## Input validation

All pipeline inputs are validated against Zod schemas before execution. This provides defense-in-depth against:

- Injection attacks (SQL injection, command injection via malformed input to tools)
- Schema drift (upstream systems sending unexpected data shapes)
- Oversized inputs (file size limits are enforced in the `fileValidator`)

See [Validation and Autofix](../architecture/validation-and-autofix.md) for details.

---

## Dependency security

### Vulnerability scanning

Before adding new dependencies, check for known vulnerabilities. After installation, run:

```bash
pnpm audit
```

Address all `high` and `critical` severity findings before merging. For `moderate` findings, evaluate the attack vector and decide on a case-by-case basis.

### Lockfile integrity

DEL pins all dependency versions via `pnpm-lock.yaml`. Do not manually edit the lockfile. Always use `pnpm install --frozen-lockfile` in CI to detect accidental lockfile drift.

---

## Logging and audit trails

- **Secrets must never be logged.** The logger service should redact sensitive fields (passwords, tokens, encryption keys) from log output. Do not log raw request bodies that may contain credentials.
- **Audit logs** record pipeline inputs and outputs. Ensure that sensitive fields (payment card numbers, PII) are redacted or tokenized before they reach pipeline inputs.

---

## Vulnerability reporting

If you discover a security vulnerability in DEL:

1. **Do not open a public GitHub issue.** Security issues should be reported privately.
2. Email the security team at **security@your-org.example.com** with:
   - A description of the vulnerability
   - Steps to reproduce
   - Affected versions
   - Any suggested mitigations

We will acknowledge your report within 48 hours and aim to release a patch within 14 days of confirmation.

Public disclosure should be coordinated with the DEL security team to allow time for patch deployment.
