# Learning Log 08: Modeling Accounts

## Entity Design & Relationships

### 1. `users` (Central Auth Anchor)
* **Columns:** `id` (UUID, PK), `email` (TEXT, UNIQUE, NOT NULL), `password_hash` (TEXT, NOT NULL), `role` (TEXT, NOT NULL), `status` (TEXT, NOT NULL), `created_at` (TIMESTAMPTZ, NOT NULL)
* **Role:** Serves as the single source of truth for global authentication, email uniqueness, and account-level status.

---

### 2. `companies` (First-Class Workspace Entity)
* **Columns:** `id` (UUID, PK), `name` (TEXT, NOT NULL), `slug` (TEXT, UNIQUE, NOT NULL), `website` (TEXT), `verified` (BOOLEAN, NOT NULL), `suspended` (BOOLEAN, NOT NULL), `created_at` (TIMESTAMPTZ, NOT NULL)
* **Role:** Represents the hiring organization. Acts as an independent entity to avoid duplicating company metadata across recruiter rows and enables bulk administrative actions (e.g., suspending all jobs owned by a company).

---

### 3. `recruiters` (Workspace Member Profile)
* **Columns:** `id` (UUID, PK), `user_id` (UUID, UNIQUE, NOT NULL, FK -> `users.id`), `company_id` (UUID, NOT NULL, FK -> `companies.id`), `company_role` (TEXT, NOT NULL), `created_at` (TIMESTAMPTZ, NOT NULL)
* **Foreign Keys:**
  * `user_id` -> `users(id)` (`ON DELETE CASCADE`): Maps a generic auth record to its recruiter profile; if the user is deleted, its profile is removed.
  * `company_id` -> `companies(id)`: Points to the recruiter's employer. FK points from recruiter to company because many recruiters belong to one company.

---

### 4. `applicants` (Job Seeker Profile)
* **Columns:** `id` (UUID, PK), `user_id` (UUID, UNIQUE, NOT NULL, FK -> `users.id`), `full_name` (TEXT, NOT NULL), `headline` (TEXT), `location` (TEXT), `attributes` (JSONB, NOT NULL), `created_at` (TIMESTAMPTZ, NOT NULL)
* **Foreign Keys:**
  * `user_id` -> `users(id)` (`ON DELETE CASCADE`): Connects job seeker profile details directly to their central auth account.

---

### 5. `admins` (Platform Operator Profile)
* **Columns:** `id` (UUID, PK), `user_id` (UUID, UNIQUE, NOT NULL, FK -> `users.id`), `created_at` (TIMESTAMPTZ, NOT NULL)
* **Foreign Keys:**
  * `user_id` -> `users(id)` (`ON DELETE CASCADE`): Connects high-privilege system operator capabilities back to an authenticatable account.

---

## Architectural Justification & Trade-offs

1. **Why Separate Profile Tables?**  
   Avoiding a single "fat" `users` table keeps schema constraints clean (`NOT NULL` on role-specific fields) and prevents sparse tables filled with `NULL` values.

2. **Why a Central `users` Table?**  
   Keeping `email` and `password_hash` in a single table avoids scanning three separate tables (`recruiters`, `applicants`, `admins`) during authentication and guarantees global email uniqueness across the entire system.

3. **Why `companies` as an Independent Table?**  
   A company is a distinct entity that posts jobs and has workspace members. Normalizing company data prevents duplication and enables clean workspace administration (such as company verification or suspension).

   # Learning Log 08: Modeling Accounts

## Entity Design & Schema (DDL)

```sql
-- 1. Central Auth Anchor
CREATE TABLE users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  role          text        NOT NULL CHECK (role IN ('recruiter', 'applicant', 'admin')),
  status        text        NOT NULL DEFAULT 'unverified' CHECK (status IN ('active', 'unverified', 'suspended')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. First-Class Workspace Entity
CREATE TABLE companies (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  website    text,
  verified   boolean     NOT NULL DEFAULT false,
  suspended  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Workspace Member Profile
CREATE TABLE recruiters (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_id   uuid        NOT NULL REFERENCES companies(id),
  company_role text        NOT NULL DEFAULT 'recruiter' CHECK (company_role IN ('owner', 'hr_manager', 'recruiter', 'hiring_manager')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 4. Job Seeker Profile
CREATE TABLE applicants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name  text        NOT NULL,
  headline   text,
  location   text,
  attributes jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Platform Operator Profile
CREATE TABLE admins (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

# Chapter 08 — Log Questions & Quick Quiz

---

## Log Questions

### 1. A teammate proposes a single `users` table with nullable `company_id`, `full_name`, and `headline` columns — everything in one place. What is the specific schema-level problem?

**Answer:**  
The core issue is **data integrity loss via a sparse table**. When role-specific columns live on a single `users` table, the database cannot enforce mandatory fields for specific roles using `NOT NULL`. 

For instance, an applicant requires a `full_name`, but the column must be marked nullable so recruiters and admins can exist without one. The database loses the ability to prevent an applicant row from being saved with a `NULL` name.

---

### 2. A company has eight recruiters. The admin suspends the company. Walk through exactly what needs to happen in the database — which tables, which rows, which columns. Why is a `companies` table the right place to put the `suspended` flag?

**Answer:**  
* **Database Actions:** The admin updates **1 single row**: setting `companies.suspended = true` where `id = <company_id>`.
* **Why `companies` is the right place:** Putting `suspended` on `companies` gives a single point of control. Instead of updating eight separate recruiter rows (and risking missing one or leaving behind orphaned jobs), a single boolean flag on the company row is checked by authorization queries and middleware to instantly block all actions and hide job postings across all eight recruiters.

---

### 3. Why does `ON DELETE CASCADE` appear on `recruiters.user_id` but NOT on `recruiters.company_id`? What would happen if you added `CASCADE` to the company FK?

**Answer:**  
* **`user_id` CASCADE:** A recruiter profile cannot exist without its base user authentication record. If the `users` row is hard-deleted, deleting the orphaned `recruiters` profile is the correct lifecycle behavior.
* **`company_id` NO CASCADE:** Deleting a company is a major domain event. If `ON DELETE CASCADE` were added to `recruiters.company_id`, accidentally deleting one company row would trigger a **silent cascading deletion** of every linked recruiter profile (and subsequently their posted jobs and received applications depending on downstream constraints). Deleting a company must be an explicit, guarded operation.

---

## Quick Quiz

### 1. An admin hard-deletes a recruiter's `users` row. What happens to the recruiter's row in the `recruiters` table — and which SQL clause governs that behaviour?

**Answer:**  
The corresponding row in the `recruiters` table is **automatically deleted**. This behavior is governed by the `ON DELETE CASCADE` clause attached to the `user_id` foreign key inside the `recruiters` table definition.

---

### 2. A recruiter leaves the company and their `users` row is suspended. Does the company's `companies` row change? Does the company's jobs listing change? Why or why not?

**Answer:**  
* **`companies` row:** Does **not** change. The company entity is independent of any single employee or recruiter.
* **Jobs listing:** Does **not** automatically change (unless specific business logic unpublishes them). The posted jobs belong directly to the company entity (`company_id`), not the individual recruiter's user account, ensuring business continuity when staff leave.

---

### 3. Two engineers debate where to store a recruiter's job title within their company (e.g. "Senior Talent Partner"). Which is correct (`users` or `recruiters`), and why?

**Answer:**  
Storing it in **`recruiters`** is correct. A job title within an organization is domain data specific exclusively to the recruiter role. The `users` table is strictly an authentication anchor meant for cross-role defaults (`email`, `password_hash`, `role`, `status`); adding role-specific metadata like job titles to `users` violates role isolation.