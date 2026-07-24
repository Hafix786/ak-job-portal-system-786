# Learning Log 06: Configuration and Secrets

## Definition of Done Checklist
- [x] A single `config` module (`src/shared/config.ts`) reads `process.env`, validates it with Zod, and exports a typed `config` object.
- [x] The app refuses to boot with a clear error when a required variable is missing or malformed.
- [x] Types are coerced (`PORT` is a number) and constraints enforced (min length on `JWT_SECRET`, valid URLs).
- [x] Nothing outside `config.ts` reads `process.env` directly — `db.ts` and `redis.ts` consume `config`.
- [x] `DATABASE_URL` and `REDIS_URL` flow through `config` to connect to local services.
- [x] `.env` is git-ignored and loaded locally; `.env.example` is committed with placeholder values.
- [x] Secrets stay out of Git history; `JWT_SECRET` was generated using cryptographic tools.

---

## Mandatory Log: Config & Secrets Decisions

**1. Why does configuration belong in the environment rather than in code — give the two failures it prevents?**
* **Failure 1: Accidental Secret Leaks.** Hardcoding secrets (like database passwords or JWT keys) inside source files risks committing them to public or shared Git repositories where they can be compromised.
* **Failure 2: Environment Coupling / Rigidity.** Hardcoding values breaks the ability to deploy the exact same compiled binary/codebase across different environments (Development, Staging, Production). Storing config in the environment allows dynamic runtime updates per host without modifying code or re-building builds.

**2. Why validate config and fail fast at startup instead of reading `process.env` where you need it — describe the bad outcome fail-fast avoids?**
Validating up front and failing fast prevents the app from running in a semi-broken or insecure state. If `JWT_SECRET` or `DATABASE_URL` is missing and we read `process.env` lazily deep in a request handler, the app will boot fine, but crash hours later when a user attempts a login or database query. Worse, it might run silently insecure (e.g., signing tokens with `undefined`). Failing fast ensures the app refuses to start at the door and tells you *exactly* what key is missing before accepting traffic.

**3. What is `.env.example` for, and why is it safe to commit when `.env` is not?**
`.env.example` serves as a public architectural contract for the codebase. It documents every environment variable key required for the application to function, paired with safe placeholder values (e.g., `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DBNAME`). It is safe to commit because it contains zero real secrets, allowing new developers or CI/CD pipelines to instantly know what values they need to configure in their local, git-ignored `.env` file.

---

## Quick Quiz

**1. `process.env.PORT` is the string `"3000"`. Which line in the schema turns it into the number `3000`, and why can't TypeScript do this for you?**
* `z.coerce.number()` performs the runtime conversion.
* TypeScript cannot do this because type checking only exists at compile time and is stripped away during build; environment variables exist as raw strings at runtime in Node.js, so runtime coercion is required.

**2. Validation fails at boot. Why log the key names but never the values?**
Logging key names tells you which variable failed validation so you can fix it. Logging the *values* would print sensitive data (like partial database credentials or secret tokens) directly into stdout/system logs, creating a major security leak risk.

**3. A teammate clones the repo and the app won't start. Which committed file tells them what to set, and why is committing it safe?**
* File: `.env.example`
* Why safe: It only contains variable names and dummy/placeholder strings—never real credentials.

**4. You find a `JWT_SECRET` was committed last week. Why is deleting the line not enough, and what must you do instead?**
* Deleting the line in a new commit is not enough because Git preserves historical commits permanently in its tree history. Anyone can look at past commits to retrieve the secret.
* Instead, you must **rotate** the secret immediately at its source (issue a new signing key) so the leaked string becomes completely worthless to attackers.

**5. Name the one rule about `process.env` that keeps the whole config approach clean.**
**"Only `src/shared/config.ts` may read `process.env`."** Every other module must import the validated `config` object.