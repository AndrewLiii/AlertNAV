# AlertNAV

A full-stack Next.js 16 app that displays live IoT road events on an interactive map. It supports email-only login (no passwords), user-scoped data in Amazon Aurora PostgreSQL, and runs locally with Docker or in production on AWS ECS Fargate behind an Application Load Balancer (ALB).

This README is written for beginners. It explains the project pieces, how they fit together, and how to run and deploy the app step-by-step.

## Table of contents

- What’s in the project
- How data flows (auth + map)
- Project structure
- Environment variables
- Database schema and migrations
- API routes
- Frontend (map, icons, timestamps)
- Local development
- Docker (local)
- Production on AWS ECS Fargate
- GitHub Actions CI/CD
- Health checks and proxy (Next.js 16)
- Troubleshooting

---

## What’s in the project

- Next.js 16 App Router
- React + Leaflet + react-leaflet for the map
- PostgreSQL (Amazon Aurora) with `pg` connection pool
- Simple email-based login (cookie stored in browser, no passwords)
- User-based data isolation via `user_email` column on `iot_data`
- Dockerfile + docker-compose for local containers
- AWS ECS Fargate deployment with ALB, ECR, and SSM Parameter Store

## How data flows (auth + map)

1. You open the site. The proxy (Next.js 16 replacement for middleware) checks for a `user_email` cookie.
	 - If no cookie, you’re redirected to `/login`.
	 - `/api/health` is always allowed (for ALB health checks).
2. On `/login`, enter an email and click Sign In.
	 - The server route `/api/auth/login` creates or updates a user in `users` and sets a `user_email` cookie.
3. After login, requests to `/api/data` are filtered by `user_email`, so you only receive your devices’ latest locations.
4. The map polls `/api/data` every few seconds and renders custom icons by event type.

---

## Project structure

```
alertnav/
├─ app/
│  ├─ page.tsx                # Home (map, logout)
│  ├─ login/page.tsx          # Email-only login page
│  ├─ api/
│  │  ├─ data/route.ts        # Returns latest device position per device for current user
│  │  ├─ auth/
│  │  │  ├─ login/route.ts    # Creates/updates user and sets cookie
│  │  │  ├─ logout/route.ts   # Clears cookie
│  │  │  └─ me/route.ts       # Returns current user info
│  │  └─ health/route.ts      # Simple 200 health probe (for ALB)
│  └─ layout.tsx, globals.css
├─ components/
│  ├─ DynamicMap.tsx          # Client loader for Map (keeps SSR happy)
│  └─ MapComponent.tsx        # Leaflet map, markers, popups, icons, timestamp formatting
├─ lib/db.ts                  # pg Pool reading from env vars
├─ proxy.ts                   # Next.js 16 request proxy (auth guard + health allow)
├─ migrate.ts                 # Runs SQL migrations from ./sql
├─ assign-user.ts             # One-off script to set user_email for existing data
├─ sql/
│  ├─ 001_create_users_table.sql
│  └─ 002_add_user_to_iot_data.sql
├─ Dockerfile
├─ docker-compose.yml
├─ next.config.ts             # output: 'standalone' for Docker
├─ AUTH_SETUP.md              # Auth-specific setup notes
├─ DOCKER_DEPLOYMENT.md       # Docker & platform deployment guide
├─ ecs-task-def.json          # ECS Task Definition template (Fargate)
└─ .github/workflows/deploy-ecs.yml  # CI to build/push/deploy to ECS
```

---

## Environment variables

Create `.env.local` with your Aurora credentials:

```
POSTGRES_HOST=your-aurora-endpoint.rds.amazonaws.com
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=postgres
POSTGRES_PORT=5432
```

The server code (and the `migrate.ts` script) reads these variables. In AWS, the same values are stored in SSM Parameter Store and injected into the ECS task.

---

## Database schema and migrations

Tables:

```
users (
	id SERIAL PRIMARY KEY,
	email VARCHAR(255) UNIQUE NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	last_login TIMESTAMP
)

iot_data (
	... existing columns ...
	user_email VARCHAR(255)  -- links each row to a user
)
```

Migrations live in `./sql` and are executed by `migrate.ts`:

- `001_create_users_table.sql` – creates `users` with indexes
- `002_add_user_to_iot_data.sql` – adds `user_email` to `iot_data` and FK to `users(email)`

One-off helper:

- `assign-user.ts` – assigns all existing `iot_data.user_email` to your email (e.g., `andrew.ruslli@gmail.com`) for testing/demo.

---

## API routes

- `GET /api/health` – returns `{ ok: true }` with 200 (used by ALB health checks)
- `POST /api/auth/login` – body: `{ email }`; creates/updates user and sets a `user_email` cookie
- `POST /api/auth/logout` – clears cookie
- `GET /api/auth/me` – returns current user (reads cookie)
- `GET /api/data` – returns latest lat/lon per device for the authenticated user

Notes:
- `GET /api/data` includes `event` so the UI can choose an icon.
- `timestamp` originates as epoch seconds; the UI converts to milliseconds for JS Date.

---

## Frontend

### Map + icons

In `components/MapComponent.tsx`:
- Uses Leaflet + react-leaflet to render markers.
- Custom icons based on `event`:
	- Blocked Road → `public/road-barrier.png`
	- Construction → `public/construction.png`
	- Stop Sign → `public/stop.png`
	- Default → `public/pin.png`

### Timestamps
- Server returns epoch seconds (e.g., `1760477044`).
- UI formats with `new Date(parseInt(device.timestamp) * 1000).toLocaleString()`.

---

## Local development

1) Install deps and set env:
- `npm install`
- create `.env.local` per above

2) Run migrations:
- `npm run migrate` (uses `dotenv` to load `.env.local`)

3) Start dev server:
- `npm run dev`
- Open http://localhost:3000 → you’ll be redirected to `/login`

4) Assign existing data (optional):
- `npx tsx assign-user.ts` (or `npm run assign-user` if you add a script)

---

## Docker (local)

We provide a multi-stage `Dockerfile` and `docker-compose.yml`.

Quick start:

```
docker-compose up --build
```

This builds the app and runs it on port 3000. The compose file loads env vars from `.env.local`.

---

## Production on AWS ECS Fargate (high level)

Components used:
- ECR repository: stores the Docker image
- ECS Fargate: runs the container in your VPC
- ALB (Application Load Balancer): public entry point, health checks
- SSM Parameter Store: stores DB credentials as parameters
- CloudWatch Logs: container logs at `/ecs/alertnav`

Steps you’ll perform once (summarized):
1. Create ECR repo `alertnav` (region `us-east-1`).
2. Put SSM parameters: `/alertnav/POSTGRES_*`.
3. Create IAM roles:
	 - `ecsTaskExecutionRole` with `AmazonECSTaskExecutionRolePolicy` + SSM read
	 - `ecsTaskRole` with SSM read (and KMS decrypt if using SecureString)
	 - GitHub OIDC role (optional but recommended) to let CI deploy
4. Create ECS cluster (Fargate), VPC/security groups.
5. Create an ALB + Target Group (IP type) on port 3000; health check path `/api/health`.
6. Register task definition from `ecs-task-def.json`.
7. Create ECS service pointing to the task, subnets, SG, and target group.

Day-2 deployments:
- Push to the `andrew/dev` branch → GitHub Actions builds and pushes the image to ECR and deploys the new task.

Security group quick tip:
- ALB SG: inbound 80 (and 443 when HTTPS), outbound all
- ECS Task SG: inbound 3000 from ALB SG, outbound all
- RDS SG: inbound 5432 from ECS Task SG

HTTPS:
- Add a cert in ACM and an HTTPS listener (443) on the ALB.
- Then set cookie `secure: true` in `login/logout` routes.

---

## GitHub Actions CI/CD

Workflow: `.github/workflows/deploy-ecs.yml`
- Builds Docker image and pushes to ECR on pushes to `andrew/dev`.
- Renders and deploys ECS task definition.

Repo secrets required:
- `AWS_ROLE_TO_ASSUME` (OIDC deploy role ARN) or access keys
- `ECS_CLUSTER_NAME`, `ECS_SERVICE_NAME`

---

## Health checks and proxy (Next.js 16)

- `proxy.ts` replaces classic `middleware.ts` in Next.js 16.
- It enforces auth on all paths except `/login`, `/api/auth/*`, and `/api/health`.
- ALB Target Group should probe `/api/health` (returns 200 JSON).

---

## Troubleshooting

Common symptoms and fixes:

- 503 from ALB
	- Targets are Unhealthy. Ensure SG allows port 3000 from ALB SG.
	- Set Target Group health check path to `/api/health`.

- ALB health check shows 307
	- Auth redirect happened. Make sure `/api/health` is excluded in `proxy.ts`.

- ECS task can’t read SSM parameters
	- Add `AmazonSSMReadOnlyAccess` (or a tight inline SSM policy) to `ecsTaskExecutionRole` (and/or `ecsTaskRole` if your app code reads SSM directly).

- Image not found (CannotPullContainerError)
	- Push an image to ECR (`alertnav:latest`). On Apple Silicon, build with `--platform linux/amd64` for Fargate.

- Cookie not set in production
	- If you run HTTP-only ALB, set cookie option `secure: false`. Turn it back to `true` when you add HTTPS.

- “ECONNREFUSED ::1:5432” locally
	- Check `.env.local` is present and correct. Ensure your Aurora endpoint allows traffic from your IP (or run via VPN/VPC if private).

---

## Scripts

- `npm run dev` – start Next.js dev server
- `npm run migrate` – run SQL migrations in `./sql`
- `npx tsx assign-user.ts` – set `iot_data.user_email` for existing rows
- `docker-compose up --build` – run locally with Docker

---

## Contributing

This project is kept intentionally simple to be beginner-friendly. PRs that improve docs, add small tests, or harden deployment are welcome.

---

## License

MIT
