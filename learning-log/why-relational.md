# Part A — The decision

## 1. Why this database, for this project. 

### I chose a relational database for my job portal primarily because of its strict guarantees around multi-row ACID transactions and referential integrity. The first requirement driving this is the all-or-nothing application submission, which ensures that creating the application, freezing the résumé snapshot, and recording screening answers either fully succeed together or cleanly roll back if the network drops. The second requirement is honest data ownership, where the database uses foreign keys to prevent "orphan data," strictly blocking applications from pointing to deleted jobs or jobs from floating without a real company. Ultimately, a relational database moves the burden of correctness from easily broken application code straight into the database core

## 2. Where you'd lose — and why you still don't switch.
### A pure document model would genuinely fit better for storing and displaying the wildly varying job attributes, since fetching a single job's unique details and rendering them in one shot is a naturally self-contained read. However, I don't add a second database for this because PostgreSQL gives us the best of both worlds in a single table via the JSONB column type. By utilizing JSONB, we can keep our strict relational columns for critical system-wide filtering—like searching for all software engineering roles across companies—while safely parking the free-form, per-role display attributes inside a flexible binary blob. This eliminates the massive operational headache of managing two separate database systems while keeping our queries fast and our relationships completely honest.

# Part B — The topics you just learned

## 1. Relational vs. Document
### **What they store:** A relational database stores data rigidly in tables with structured rows and columns, whereas a document database stores data in loose, self-contained files (like JSON blobs or documents).

### **What they enforce:** A relational database strictly enforces schema validity, data types, and structural relationships (like foreign keys) directly at the database level. A document database leaves all checking, relation-validating, and cleanup logic entirely to your application code, meaning you must manually write code to ensure your data stays correct across records.

## 2. Transactions & Atomicity
### **What a transaction is:** A transaction is a bundled group of multiple database changes (writes) that are executed together as a single, protected block.

### **What atomicity means here:** It means the entire application submission process is completely all-or-nothing. When an applicant applies to a shortlist spanning two companies, the database guarantees that creating both applications, snapshotting the résumé, saving screening answers, and bumping the recruiter's applicant counters will either all succeed together or completely roll back as if nothing happened if a server crashes.

### **The exact bad state risked without it:** Without atomicity, a crash mid-request could create a broken, corrupt state where the database saves the application for Company A but loses the application for Company B, or worse, saves screening answers in a vacuum while losing the main application record entirely.

## 3. Foreign Keys & Referential Integrity
### **What a foreign key guarantees:** A foreign key guarantees referential integrity, meaning a column in one table is strictly policed to ensure it always points to a valid, existing row in another table.

## Two things the database will refuse to do (using applications.job_id → jobs.id):

### 1. The database will refuse to insert a new application if the submitted job_id doesn't match a real, existing job ID.
### 2. The database will refuse to delete an active job posting if there are still applications in the system pointing to that job's ID (unless explicitly told to cascade delete).

## 4. Joins
### **What a join is:** A join combines related data from separate tables into a single query result by matching their keys.

### **A screen that needs it:** The Public Job Board screen, which displays a list of open jobs where each job card must show the specific name of the company that posted it.

### **Tables touched:** It touches the jobs table and the companies table.

### **What goes wrong without joins:** Without joins, the portal triggers the devastating N+1 query problem. The backend would have to run 1 query to fetch a list of 20 jobs, and then execute 20 additional individual queries looping through the database just to find the corresponding company name for each job card, drastically slowing down the app.

## 5. The JSONB Hybrid
### Postgres gives you both worlds by letting you keep strict, relational columns for standard structural data, while dedicating a specific column utilizing the JSONB (Binary JSON) type to hold a flexible, schemaless document payload within that exact same row. This binary format allows Postgres to natively look inside and run optimized queries directly on the nested properties.

### For the jobs table, the split looks like this:

### **Real Columns (Strict)** status ('open' | 'closed'): Justification: This field is used to gate logic and actively filter the main board ("only show open jobs"), meaning it must be highly indexable and queryable across the whole system.

### deadline: Justification: This field is heavily used in comparison queries to automatically hide expired listings or block applicants from hitting submit past the date.

## JSONB Attributes (Flexible)
### **tech_stack:** Justification: This field varies wildly by role (an engineering job needs arrays of frameworks, while a design or sales job doesn't use tech stack properties at all) and is mainly used to display tags on the details page.

## perks:
### **Justification:** This contains arbitrary textual information (e.g., "Free coffee", "Remote options") that is only rendered when a user clicks open a job's specific detail page; the platform never needs to filter or sort the main board by it.