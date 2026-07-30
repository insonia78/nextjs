# Deploy AI Study Planner on a GCP VM

This deployment path runs the whole application on one Compute Engine VM with Docker Compose.

It is the simplest way to get this monorepo online on GCP without splitting the app into multiple managed services.

## What this stack runs

- Next.js frontend on port `3000`
- NestJS gateway on port `4000`
- Auth service on port `3001`
- Planner service on port `3002`
- Progress service on port `3003`
- AI service on port `3004`
- PostgreSQL on port `5432`
- MongoDB on port `27017`
- Ollama on port `11434`

## 1) Create the VM

Use an Ubuntu VM on Compute Engine.

Recommended starting point:

- machine type: `e2-standard-4`
- boot disk: `30 GB` or larger
- OS: Ubuntu 24.04 LTS
- firewall: allow `22`, `3000`, and `4000`

If you want Ollama to be usable for more than fallback behavior, use a larger VM. Without a GPU, Ollama will work slowly.

## 2) Install VM dependencies

SSH into the VM and run:

```bash
chmod +x deploy/gcp-vm/*.sh
./deploy/gcp-vm/setup-vm.sh
newgrp docker
```

## 3) Clone the repository

```bash
git clone YOUR_REPOSITORY_URL ai-study-planner
cd ai-study-planner
```

## 4) Configure environment values

Copy the VM deployment env file:

```bash
cp deploy/gcp-vm/.env.example deploy/gcp-vm/.env
```

Edit `deploy/gcp-vm/.env` and set:

- `VM_PUBLIC_IP` to the VM external IP
- `PUBLIC_APP_URL` to the public frontend origin
- `PUBLIC_API_URL` to the public API origin used by the frontend
- `POSTGRES_PASSWORD` to a real password
- `JWT_SECRET` to a long random value
- optionally `OLLAMA_MODEL`

Examples:

- direct ports: `PUBLIC_APP_URL=http://YOUR_VM_PUBLIC_IP:3000` and `PUBLIC_API_URL=http://YOUR_VM_PUBLIC_IP:4000`
- single-domain Nginx: `PUBLIC_APP_URL=https://study.example.com` and `PUBLIC_API_URL=https://study.example.com`

## 5) Start the stack

From the repo root:

```bash
./deploy/gcp-vm/start-stack.sh
```

Check status:

```bash
docker compose --env-file deploy/gcp-vm/.env -f deploy/gcp-vm/docker-compose.yml ps
```

View logs:

```bash
docker compose --env-file deploy/gcp-vm/.env -f deploy/gcp-vm/docker-compose.yml logs -f gateway-service
```

## 6) Seed the databases

Create `database/.env` with the VM-local database values if you want to manage it yourself, or use the included template:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=study_planner
MONGO_URI=mongodb://127.0.0.1:27017/study_planner_sessions
```

Then run:

```bash
cp deploy/gcp-vm/database.env.example database/.env
./deploy/gcp-vm/seed-data.sh
```

## 7) Open the app

Use these URLs:

- frontend: `http://YOUR_VM_PUBLIC_IP:3000`
- gateway health: `http://YOUR_VM_PUBLIC_IP:4000/health`

The frontend talks to the gateway using `PUBLIC_API_URL`, which is baked into the client build.

## Notes

- If you do not want Ollama, remove the `ollama` service and the `OLLAMA_BASE_URL` line from the AI service block. The AI service already has fallback responses when Ollama is unavailable.
- An example single-domain reverse proxy file is included at `deploy/gcp-vm/nginx.study-planner.conf`.
- For production, put Nginx or Caddy in front of ports `3000` and `4000`, then terminate HTTPS there.
- Do not expose PostgreSQL, MongoDB, or Ollama to the public internet unless you have a specific reason.
- If you later add a domain, rebuild the frontend container with the domain value instead of the raw VM IP, because the `NEXT_PUBLIC_*` URLs are baked in at build time.
- To stop the stack, run `./deploy/gcp-vm/stop-stack.sh`.