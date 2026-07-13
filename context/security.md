# Security

## Authentication flow — dual-token stateless

| Token | TTL | Storage | Transmission |
|---|---|---|---|
| Access token (JWT) | 15 min | Client memory, **never** `localStorage` | `Authorization: Bearer <token>` header |
| Refresh token (opaque UUID) | 7 days | `HttpOnly`, `Secure`, `SameSite=Strict` cookie | Sent automatically by browser on `/auth/refresh`, inaccessible to JS |

## JWT access token claims

| Claim | Type | Value |
|---|---|---|
| sub | String | User UUID |
| role | String | ADMIN / LECTURER / STUDENT |
| email | String | User email |
| iat | Long | Issued-at Unix timestamp |
| exp | Long | `iat + 900` seconds |

Signing secret ≥ 256 bits, read from `JWT_SECRET` env var. Never
hardcoded, never committed, different per environment.

## Refresh token rotation (single-use)

1. Client POSTs `/auth/refresh` with the refresh cookie.
2. Server computes `SHA-256(token)`, looks it up in `revoked_tokens`.
3. Found → `401 TOKEN_REVOKED` (possible theft; force re-login).
4. Not found, not expired → issue new access + refresh token.
5. Server inserts `SHA-256(old_refresh_token)` into `revoked_tokens`.
6. New refresh token set as `HttpOnly` cookie.
7. Nightly `@Scheduled` job deletes expired rows from `revoked_tokens`.

## Spring Security filter chain (in order)

| # | Rule | Effect |
|---|---|---|
| 1 | CSRF disabled | Stateless REST API doesn't need it (no session cookies for state) |
| 2 | CORS config | React dev server (localhost:3000) in dev; prod origin only in prod |
| 3 | Session management = STATELESS | No `HttpSession` ever created; horizontal scalability |
| 4 | Permit `/api/v1/auth/**` | Public, no token required |
| 5 | **Permit `/api/v1/public/**`** | Public, no token required — landing page backend (see below) |
| 6 | `JwtAuthFilter` (before `UsernamePasswordAuthFilter`) | Extracts Bearer token, validates signature+expiry, sets `SecurityContext` |
| 7 | `hasRole('ADMIN')` for `/api/v1/admin/**` | Only ADMIN |
| 8 | `hasAnyRole('ADMIN','LECTURER')` for `/performance/ranking` | Students cannot see cohort ranking |
| 9 | Authenticated for all other `/api/v1/**` | Valid token grants base access; service layer enforces own-data rules |

## Password security

- **Algorithm:** BCrypt, cost 12 (~250ms hash time).
- **Storage:** only the BCrypt hash. Raw password never logged, never
  returned, never stored anywhere else.
- **Reset:** random UUID token, SHA-256'd before DB storage, emailed once,
  expires in 1 hour.
- **Strength:** ≥ 8 chars, ≥1 uppercase, ≥1 digit, ≥1 special character —
  enforced via `@Pattern` on `RegisterRequest`.

## Data protection rules

| Rule | Implementation |
|---|---|
| Entities never leave the service layer | MapStruct maps Entity → DTO before returning from any service method |
| Student data minimisation in AI prompts | Risk/career prompts use `student_id` (UUID), not name/email; raw grades summarised before submission |
| No secrets in logs | JWT secrets, API keys, password hashes excluded via custom `PatternLayout` exclusion rules |
| HTTPS only in production | Nginx terminates TLS; Spring trusts `X-Forwarded-Proto`, redirects HTTP → HTTPS |
| Rate limiting on AI endpoints | Bucket4j: 20 AI requests/min/user |

## Public endpoint exposure and abuse protection

`/api/v1/public/**` (see `api-reference.md` §Public website endpoints) is
the most exposed part of the system by design — unauthenticated on
purpose — so it gets its own hardening on top of rule 5 above:

- **Rate limiting:** `/public/contact` and `/public/newsletter` are capped
  at 5 requests/minute/IP via the same Bucket4j integration used for AI
  endpoints.
- **Input handling:** request bodies are size-capped and HTML-stripped
  before persisting to `leads`.
- **Bot filtering:** a honeypot field (hidden input real users never fill)
  is used instead of a CAPTCHA — filters bots without adding friction.
- **No DB pressure from traffic spikes:** `/public/stats` reads from a
  Redis-cached summary object refreshed on a schedule; it never queries
  per-user tables directly, so landing-page traffic can't load the core
  academic database.

## When adding a new endpoint or role check

1. Decide the narrowest role/ownership check that satisfies the feature —
   default to `authenticated + own-data` before reaching for a broader
   role.
2. Add the row to `api-reference.md` in the same PR.
3. If it's genuinely public (no user context at all), it belongs under
   `/api/v1/public/**` and needs a rate limit — don't add unauthenticated
   routes anywhere else in the API.
4. Write the `SecurityFilterChain` rule and a test asserting the
   unauthorized case returns 401/403 as expected.
