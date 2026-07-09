## Mandatory Log: Project Bootstrap Decisions

**1. Which folder structure did you choose, and why?**
I chose the **Feature/Module-Based structure**. If I used a Layer-Based structure, adding a new feature like "saved jobs" would require me to open and modify three separate, bloated folders (`controllers/`, `services/`, `repositories/`), scattering the feature's logic across the entire codebase. With a feature-based structure, I just add one single `modules/saved-jobs/` folder. It keeps the code highly cohesive (things that change together live together) and loosely coupled, making it much easier to scale without the repo collapsing into chaos.

**2. Why keep TypeScript `strict` mode on — what does it catch, and when?**
Strict mode acts as a safety net that catches potential crashes—like null references, missing properties, or passing a string instead of a number—**at compile time**, right inside the code editor. This prevents those same bugs from silently making it to production and exploding at **runtime** in front of a real user.

**3. What's the difference between how your app runs in development (`dev`) versus production (`start`)?**
* **Development (`dev`):** Uses `tsx` to run the raw `.ts` files directly and watches for file changes to hot-reload the server instantly. It is built for rapid feedback.
* **Production (`start`):** Uses the standard `node` engine to execute the static, compiled `.js` files located in the `dist/` folder. It doesn't type-check or hot-reload; it's built purely for stability and speed.

**4. Why split `app.ts` from `server.ts` — what does it buy you in Chapter 30?**
`app.ts` builds and configures the framework, while `server.ts` actually binds it to a network port and listens. This separation buys extreme testability. In Chapter 30, I will be able to import the `buildApp()` function directly into my test suites and fire mock in-memory HTTP requests at it. Because it isn't hard-bound to a port, my tests won't crash from port collisions or slow down from opening real network listeners.

---

## Quick Quiz

**1. Why is feature/module-based structure required for this course rather than just recommended?**
Because the entire course's future instructions, file paths, and structural commands are written assuming this exact blueprint. If I used a layered layout, none of the upcoming tutorials would line up, forcing me to mentally translate every single instruction.

**2. What does `"strict": true` catch, and at what moment — compile time or runtime?**
It catches type mismatches, unhandled `null`/`undefined` variables, and missing data contracts entirely at **compile time** (while writing and building the code).

**3. Which script runs your `.ts` directly with reload, and which runs the compiled `.js`?**
* `npm run dev` runs `.ts` directly with hot-reload.
* `npm start` runs the compiled `.js`.

**4. Which file listens on a port — `app.ts` or `server.ts` — and why is that separation useful for testing?**
`server.ts` listens on the port. This separation allows automated tests to import the fully configured app instance directly from `app.ts` to test routing and logic in memory without opening a real network port, which avoids "address already in use" errors and speeds up test execution.

**5. Name two things `.gitignore` must exclude and why each one belongs there.**
1. **`node_modules/`:** It is a massive, generated folder of dependencies that can be instantly recreated via `package.json`. Tracking it would severely bloat the git repository.
2. **`.env`:** It holds sensitive runtime secrets, database passwords, and API keys. Committing it would permanently leak those secrets into the repository's history.

## How I Structured My Job-Portal Backend — And the Trade-offs I Chose

Today, I scaffolded the application skeleton for my real-time job portal. Instead of falling into the standard tutorial pattern of grouping files by technical layer (putting all controllers together, all services together, etc.), I opted for a strictly **Feature/Module-Based (Modular) Architecture**.

### The Trade-off
Layered structures are simple for tiny apps with 3 endpoints, but they scatter code everywhere as projects grow. By switching to a modular approach up front, everything relating to a specific domain (like `jobs/` or `applications/`) stays encapsulated inside its own folder context:

*   **Routes**
*   **Services**
*   **Repositories**
*   **Schemas**

This structural decision ensures **high cohesion** and **low coupling**. Modifying or adding a feature down the line won't require tearing through five completely unrelated folders across the repository, keeping the codebase manageable and clean for future expansion and upcoming project vivas.
"""

file_path = "build-in-public-note.md"
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"File saved successfully as {file_path}")