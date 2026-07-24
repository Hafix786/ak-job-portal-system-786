# Learning Log 05: Local Environment with Docker

## Core Reflections

1. **Containers vs. Images**
   An image is a static, read-only blueprint (the recipe) containing the operating system, code, and dependencies. A container is the isolated, active running instance (the cooked dish) created from that image.

2. **Docker vs. Native Installation**
   Running services natively causes version drift across team environments and leaves unwanted background processes running on host machines. Docker prevents "works on my machine" bugs by guaranteeing every developer runs the exact same isolated environment.

3. **Volumes & Cleanup**
   A named volume (`pgdata`) saves database files on the host computer's disk outside the container lifecycle.
   * `docker compose down` stops and removes containers while keeping named volumes intact.
   * `docker compose down -v` removes both containers and named volumes, permanently deleting all stored data.

---

## Quick Quiz

### 1. An image is to a container as a recipe is to a ____ — fill the blank and say why one image can run as many containers.
**Answer:** **Dish** (or actual food item). An image acts as a read-only blueprint, allowing you to spin up multiple independent running instances (containers) off the same blueprint without modifying the original source image.

### 2. Why pin `postgres:16` instead of `postgres:latest`?
**Answer:** `latest` automatically updates to new major versions over time, breaking reproducibility and introducing silent incompatibility bugs. Pinning `postgres:16` guarantees development stays aligned with production.

### 3. Your `DATABASE_URL` uses host `localhost` — why, and what would the host become once the app itself runs inside Docker?
**Answer:** It uses `localhost` because container port `5432` is mapped to your host computer's network port. Once the app itself runs inside a container on the same Docker network, the host becomes the Docker service name (`postgres`).

### 4. You ran `docker compose down -v` and your data vanished. What did the `-v` do, and which command keeps the data?
**Answer:** The `-v` flag instructed Docker to delete all attached volumes along with the containers. To stop containers while preserving database volume data, run plain `docker compose down`.

### 5. `psql` says "connection refused" the instant after `up`. What's the most likely cause, and what feature removes this race during automated startup?
**Answer:** The Postgres engine process is still initializing its system tables in memory and isn't ready for network connections yet. Adding a Compose **`healthcheck`** (using `pg_isready`) allows applications to wait for real service readiness before connecting.