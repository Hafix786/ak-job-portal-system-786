# Learning Log: 03-choosing-your-stack.md
## Architecture Decision Records & Core Concepts

---

## Part A — The Decisions (ADR Trail)

### 1. Core Stack Specifications
* **Base Language & Runtime:** Node.js + TypeScript. 
  * *Why:* It allows us to catch code errors and structural mismatches right inside our editor before any code executes, protecting a complex web of jobs and applications from breaking at runtime.
  * *Tradeoff:* We give up zero-setup execution speed, as TypeScript introduces a mandatory compilation step before the app can run on Node.js.
* **Database Engine:** PostgreSQL.
  * *Why:* It guarantees strict relational consistency (ACID) across multi-row application checkouts while offering a first-class `JSONB` column to elegantly handle messy, per-role job details in the exact same table.
  * *Tradeoff:* We trade away the effortless, schema-free setup of a pure document store, requiring us to manage migrations and index designs explicitly.
* **Web Framework:** Fastify (Lean-Modern).
  * *Why:* It delivers excellent production performance and has built-in hooks for schema validation without cluttering our codebase with excessive framework "magic."
  * *Tradeoff:* We give up out-of-the-box directory structures and pre-made module architectures, meaning we are fully responsible for keeping our folders clean and disciplined.
* **Database Access Tool:** Prisma (or Drizzle).
  * *Why:* It provides great developer productivity with automated migration tracking and a highly typed database client that catches invalid queries during compilation.
  * *Tradeoff:* It abstracts raw queries away, which can easily camouflage underlying database performance issues if we don't actively inspect what it executes under the hood.
* **Boundary Validation Library:** Zod.
  * *Why:* It serves as an explicit security guard at our API boundaries, parsing actual network bytes at runtime and automatically keeping our type definitions perfectly synchronized.
  * *Tradeoff:* Validating every single incoming network payload adds a tiny fraction of runtime processing overhead at our server gateways.
* **In-Memory Cache & Broker:** Redis.
  * *Why:* It keeps our infrastructure highly efficient by performing double duty as our fast memory cache for hot reads and the underlying engine for our background tasks.
  * *Tradeoff:* Because data is stored in volatile server RAM, we must design our codebase defensively to expect that cached values can disappear at any moment.
* **Task Management Queue:** BullMQ.
  * *Why:* It offloads slow, heavy workflows—like parsing PDF résumés or dispatching confirmation emails—to a separate worker so the user's browser never encounters a freezing screen.
  * *Tradeoff:* It introduces asynchronous architectural complexity, meaning we have to monitor and debug a completely separate background worker layer.
* **Object Cloud Storage:** S3-Compatible Storage (MinIO locally / AWS S3 in production).
  * *Why:* It keeps our core database lightweight and highly performant by shifting heavy binary files, like applicant résumés, out of database rows and onto optimized object storage via URL references.
  * *Tradeoff:* It creates an independent storage layer that we must manually keep secure and mapped to our primary database tables.

### 2. The Pick Debated Most
The closest decision was choosing between a **Lean-Modern Framework (Fastify)** and a **Batteries-Included Framework (NestJS)**. NestJS was incredibly tempting because it gives you a rigid, structured architecture right out of the box, ensuring large developer teams write code uniformly. 

What ultimately tipped the scale toward **Fastify** was our commitment to clean, explicit code wiring. NestJS relies heavily on TypeScript decorators and hidden framework logic. If a critical request pathway fails or breaks in production at 2 a.m., digging through layers of hidden framework magic to find the bug can be incredibly painful. Fastify gives us great speed and excellent type safety while ensuring that the pathway from an incoming HTTP request to our code execution remains totally transparent and readable.

---

## Part B — The Concepts It Rests On

### 1. TypeScript vs. JavaScript
Imagine a recruiter panel function designed to score an application based on a candidate's numerical screening answers:
```typescript
function scoreApplication(answerCount: number) { /* ... */ };

```

If a minor frontend bug or an unvalidated code path accidentally captures the user input as a string text object instead of a clean number (for example, passing "3" instead of 3), plain JavaScript will happily execute the function anyway. This results in silent, corrupt evaluation math ("3" * 10 evaluates to 30 in JS due to implicit type coercion, but an operation like "3" + 3 becomes "33" instead of 6), leading to completely broken stats displayed straight onto a recruiter's screen or an applicant's score calculation.

TypeScript stops this bug instantly inside our development environment with a compile-time type mismatch error (Argument of type 'string' is not assignable to parameter of type 'number'), forcing us to fix the data structure before the code can ever be deployed or reach a real user.

### 2. The Framework Axis
The framework axis measures how much a tool does for you out of the box versus how much architectural freedom it leaves to you.

* **Minimal (e.g., Express):** Delivers simple, bare-bones routing and middleware. It gives you absolute freedom but forces you to hand-craft every single structural convention, folder pattern, and utility layer yourself. This makes it incredibly easy to accidentally turn a growing project into a disorganized, chaotic repository if you lack strict team discipline.
* **Batteries-Included (e.g., NestJS):** Enforces a rigid, pre-built architectural pattern utilizing modules, controllers, and built-in dependency injection containers right from day one. However, it comes with a steep learning curve and introduces complex layers of framework abstraction that run heavily on hidden background "magic."

Our choice, **Fastify, sits firmly on the Lean-Modern middle ground**. It keeps your web routing transparent, explicit, and easy to follow without hidden decorators wiring things up behind the scenes. Yet, it delivers native TypeScript support, exceptional routing performance, and seamless input validation hooks right out of the box. This fits our job portal perfectly because it ensures maximum processing speed while keeping the backend codebase completely readable, predictable, and easy to debug at 2 a.m.

### 3. The Database-Access Spectrum
* **Raw SQL:** Writing literal database query strings manually directly within your backend source code. It provides absolute visibility and zero tool magic, but it is highly repetitive, prone to syntax errors, requires manual data mapping, and lacks type safety.
* **Query Builders (e.g., Drizzle):** Writing typed TypeScript function chains that directly match the layout and mentality of actual SQL syntax. This gives you a predictable, SQL-first mentality paired with compile-time type safety.
* **ORMs (e.g., Prisma):** Treating your relational tables entirely as native objects in your code while the tool generates the underlying SQL syntax automatically behind the scenes. It offers exceptional development velocity and clean, automated migrations.

The danger of leaning blindly on an ORM is that it tempts developers into treating the database like an invisible bucket. This easily conceals severe performance bugs, most notably the **N+1 Query Problem**. This occurs when an ORM loops through related records implicitly—such as executing 1 main query to get a list of 20 jobs, and then running 20 additional separate database queries behind your back to fetch the company name for each individual card. This fires dozens of unnecessary network hits and slows down your public job board to a crawl without you even realizing why your code is slow.

### 4. Runtime Validation
TypeScript types are entirely a compile-time safety contract. They exist purely to inspect code correctness while you write it, and they are completely erased and stripped away before your JavaScript actually executes on Node.js.

When raw network bytes arrive at our API from an applicant's browser or a malicious automated script, TypeScript no longer exists to police them. If a user submits a missing job ID or a text string where a number belongs, a type check cannot stop it.

A schema library like **Zod provides runtime protection**. It acts as a hard guard at our API gate, actively parsing incoming JSON payloads at execution time to reject invalid formats, malicious strings, or missing items. It then automatically extracts and infers the compile-time types from that exact schema, ensuring our code validation rules and static type definitions never fall out of sync.

---

### 5. Redis's Double Duty
Redis acts as a high-performance, in-memory data store that effectively executes two completely distinct jobs in our portal architecture:

* **The Caching Layer:** It stores hot, frequently requested read data (like our public job board listings) in system RAM so our application doesn't have to constantly hit PostgreSQL for repetitive requests. This is utilized in **Module 9 (Caching)**.
* **The Job Queue Backbone:** It operates as the lightning-fast message broker and state manager for **BullMQ**, keeping track of active background queues, worker balances, and deferred tasks. This is utilized in **Module 13 (Background Workers)**.

## Quick Quiz

### 1. True or false: TypeScript's types check the actual data in an HTTP request body at runtime.
**False.** TypeScript types are entirely a compile-time safety contract and are completely erased before your JavaScript executes on Node.js. They do not check or protect your server from actual data arriving over the network at runtime.

### 2. On the framework axis, which is the most "batteries-included" of Express, Fastify, NestJS?
**NestJS.** It is a heavily opinionated framework that enforces a rigid architectural structure out of the box using modules, controllers, and dependency injection patterns.

### 3. Which database-access approach is most likely to hide an N+1 query — raw SQL, query builder, or ORM?
**ORM (Object-Relational Mapper).** Because full ORMs abstract tables away behind native objects, they make it easy to inadvertently loop through related records and trigger dozens of hidden database queries behind the scenes without the developer realizing it.

### 4. Zod runs at compile time or at runtime?
**Runtime.** Zod acts as a security guard at your API gate, actively parsing and validating incoming network bytes at execution time while the server is running.

### 5. Name the two roles Redis plays in this stack.
1. **The Caching Layer:** Storing hot, frequently read data in system RAM to avoid repetitive hits to the primary database.
2. **The Job Queue Backbone:** Serving as the rapid message broker and state manager for background workers managed by BullMQ.