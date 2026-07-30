# Deploy AI Study Planner to Google Cloud Run

This monorepo is a multi-service application. On Cloud Run, deploy it as six services:

- `study-planner-frontend`
- `study-planner-gateway`
- `study-planner-auth`
- `study-planner-planner`
- `study-planner-progress`
- `study-planner-ai`

## Required managed services

Cloud Run does not host your databases for you. Use:

- Cloud SQL for PostgreSQL
- MongoDB Atlas for progress sessions

The AI service can run on Cloud Run without Ollama because it already contains a local fallback response path. If you want live Ollama responses, host Ollama somewhere else and set `OLLAMA_BASE_URL` to that endpoint.

## 1) Prerequisites

Install and authenticate:

```powershell
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com
```

Create an Artifact Registry repository:

```powershell
gcloud artifacts repositories create study-planner --repository-format=docker --location=YOUR_REGION
```

## 2) Provision databases

### PostgreSQL with Cloud SQL

Create a PostgreSQL instance and database:

```powershell
gcloud sql instances create study-planner-pg --database-version=POSTGRES_15 --tier=db-custom-1-3840 --region=YOUR_REGION
gcloud sql databases create study_planner --instance=study-planner-pg
gcloud sql users create study_planner_user --instance=study-planner-pg --password=YOUR_DB_PASSWORD
```

For Cloud Run, the PostgreSQL host should be the Cloud SQL Unix socket path:

```text
/cloudsql/YOUR_GCP_PROJECT_ID:YOUR_REGION:study-planner-pg
```

### MongoDB

Create a MongoDB Atlas cluster and capture a connection string like:

```text
mongodb+srv://USER:PASSWORD@cluster.mongodb.net/study_planner_sessions
```

## 3) Build service images

Build each backend image from the monorepo root using `deploy/cloud-run/Dockerfile.service`:

```powershell
docker build -f deploy/cloud-run/Dockerfile.service --build-arg SERVICE_PATH=services/auth-service -t YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/auth-service:latest .
docker push YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/auth-service:latest
```

Repeat for each backend service by changing `SERVICE_PATH`.

## 4) Deploy backend services

### Auth service

```powershell
gcloud run deploy study-planner-auth `
  --image YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/auth-service:latest `
  --region YOUR_REGION `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --add-cloudsql-instances YOUR_GCP_PROJECT_ID:YOUR_REGION:study-planner-pg `
  --set-env-vars PORT=8080,CORS_ORIGIN=https://YOUR_FRONTEND_URL,DB_HOST=/cloudsql/YOUR_GCP_PROJECT_ID:YOUR_REGION:study-planner-pg,DB_PORT=5432,DB_USERNAME=study_planner_user,DB_PASSWORD=YOUR_DB_PASSWORD,DB_NAME=study_planner,JWT_SECRET=YOUR_JWT_SECRET
```

### Planner service

```powershell
gcloud run deploy study-planner-planner `
  --image YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/planner-service:latest `
  --region YOUR_REGION `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --add-cloudsql-instances YOUR_GCP_PROJECT_ID:YOUR_REGION:study-planner-pg `
  --set-env-vars PORT=8080,CORS_ORIGIN=https://YOUR_FRONTEND_URL,DB_HOST=/cloudsql/YOUR_GCP_PROJECT_ID:YOUR_REGION:study-planner-pg,DB_PORT=5432,DB_USERNAME=study_planner_user,DB_PASSWORD=YOUR_DB_PASSWORD,DB_NAME=study_planner
```

### Progress service

```powershell
gcloud run deploy study-planner-progress `
  --image YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/progress-service:latest `
  --region YOUR_REGION `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --set-env-vars PORT=8080,CORS_ORIGIN=https://YOUR_FRONTEND_URL,MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/study_planner_sessions
```

### AI service

```powershell
gcloud run deploy study-planner-ai `
  --image YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/ai-service:latest `
  --region YOUR_REGION `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --set-env-vars PORT=8080,CORS_ORIGIN=https://YOUR_FRONTEND_URL,OLLAMA_BASE_URL=https://YOUR_OLLAMA_ENDPOINT,OLLAMA_MODEL=llama3.2
```

If you are relying on the built-in fallback behavior, you can omit the Ollama env vars.

### Gateway service

Deploy the gateway last, after you have the backend service URLs:

```powershell
gcloud run deploy study-planner-gateway `
  --image YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/gateway-service:latest `
  --region YOUR_REGION `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --set-env-vars PORT=8080,CORS_ORIGIN=https://YOUR_FRONTEND_URL,AUTH_SERVICE_URL=https://study-planner-auth-xxxxx.a.run.app,PLANNER_SERVICE_URL=https://study-planner-planner-xxxxx.a.run.app,PROGRESS_SERVICE_URL=https://study-planner-progress-xxxxx.a.run.app,AI_SERVICE_URL=https://study-planner-ai-xxxxx.a.run.app
```

## 5) Build and deploy the frontend

The frontend needs the deployed gateway URL at build time because the `NEXT_PUBLIC_*` variables are embedded into the client bundle.

Build the image:

```powershell
docker build -f deploy/cloud-run/Dockerfile.frontend `
  --build-arg NEXT_PUBLIC_AUTH_API_URL=https://study-planner-gateway-xxxxx.a.run.app `
  --build-arg NEXT_PUBLIC_PROGRESS_API_URL=https://study-planner-gateway-xxxxx.a.run.app `
  --build-arg NEXT_PUBLIC_AI_API_URL=https://study-planner-gateway-xxxxx.a.run.app `
  --build-arg NEXT_PUBLIC_PLANNER_GRAPHQL_URL=https://study-planner-gateway-xxxxx.a.run.app/graphql `
  --build-arg NEXT_PUBLIC_WS_URL=https://study-planner-gateway-xxxxx.a.run.app `
  -t YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/frontend:latest .

docker push YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/frontend:latest
```

Deploy it:

```powershell
gcloud run deploy study-planner-frontend `
  --image YOUR_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/study-planner/frontend:latest `
  --region YOUR_REGION `
  --platform managed `
  --allow-unauthenticated `
  --port 8080
```

## 6) Update backend CORS

After the frontend is deployed, redeploy the backend services and gateway with:

```text
CORS_ORIGIN=https://study-planner-frontend-xxxxx.a.run.app
```

The frontend and gateway URLs must match your actual Cloud Run domains.

## 7) Seed production data

Run the seed scripts from a trusted machine with production environment variables pointing to your Cloud SQL and MongoDB instances:

```powershell
npm run seed:postgres
npm run seed:mongo
```

Do not seed against production unless you intend to overwrite existing data.

## Deployment notes

- Cloud Run supports WebSockets, so the `/socket.io` proxy can work through the gateway.
- Keep `PORT=8080` for every deployed Cloud Run service.
- For production, move secrets to Secret Manager instead of passing them directly with `--set-env-vars`.
- If you want private backends later, the simplest first step is to get the app working with public service URLs and then harden ingress and IAM afterward.