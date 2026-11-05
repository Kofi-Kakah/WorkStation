# Deployment Guide

This guide deploys the WorkStation platform to Google Cloud:

- **Frontend:** static SPA on Firebase Hosting, with `/api/**` rewritten to
  Cloud Run.
- **Backend:** Express API container on Cloud Run, built by Cloud Build and
  stored in Artifact Registry.
- **Data:** Cloud Firestore, Firebase Storage, Firebase Authentication, and
  Firebase Cloud Messaging in project `workshop-111f1` (see `.firebaserc`).
- **Credentials:** Application Default Credentials (ADC) from the Cloud Run
  service account. No service-account key is stored in the repository or image.

The commands below are the intended production path. They require access to a
real Google Cloud project and Firebase project; no credentials are included in
this repository.

## 1. Prerequisites

| Tool | Purpose |
|---|---|
| Node.js 22 + npm | Local builds and tests |
| Google Cloud CLI (`gcloud`) | Project setup and Cloud Build submission |
| Firebase CLI (`firebase-tools`) | Rules, indexes, and Hosting deployment |
| Docker (optional) | Local container verification |

Check access:

```bash
gcloud auth login
gcloud config set project workshop-111f1
firebase login
firebase projects:list
```

The project must have billing enabled, Firestore in Native mode, a Storage
bucket, and Firebase Authentication with the Email/Password provider enabled.
Enable Cloud Messaging if browser push is required.

## 2. One-time Google Cloud setup

### 2.1 Enable APIs

```bash
PROJECT_ID=workshop-111f1

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  identitytoolkit.googleapis.com \
  fcm.googleapis.com \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  --project "$PROJECT_ID"
```

### 2.2 Create the runtime service account

```bash
PROJECT_ID=workshop-111f1
RUNTIME_SA="workstation-api@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create workstation-api \
  --display-name "WorkStation API runtime" \
  --project "$PROJECT_ID"
```

Grant least-privilege roles:

```bash
for ROLE in \
  roles/datastore.user \
  roles/firebaseauth.admin \
  roles/firebasecloudmessaging.admin \
  roles/storage.objectAdmin \
  roles/iam.serviceAccountTokenCreator
do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="$ROLE" \
    --condition=None
done
```

Grant `serviceAccountTokenCreator` on the service account itself so the Admin
SDK can sign attachment download URLs (`signBlob`):

```bash
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project "$PROJECT_ID"
```

`roles/datastore.user`, `roles/firebaseauth.admin`,
`roles/firebasecloudmessaging.admin`, and `roles/storage.objectAdmin` cover the
Firestore, Auth, FCM, and Storage calls the backend makes. Do not grant
`roles/owner` or `roles/editor` to this account.

### 2.3 Grant the Cloud Build service account deployment rights

```bash
PROJECT_ID=workshop-111f1
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

for ROLE in \
  roles/run.admin \
  roles/iam.serviceAccountUser \
  roles/artifactregistry.writer
do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${BUILD_SA}" \
    --role="$ROLE"
done
```

`roles/iam.serviceAccountUser` lets Cloud Build deploy Cloud Run revisions that
run as the runtime service account.

Create the Artifact Registry repository once (Cloud Build needs
`roles/artifactregistry.writer`, which does not include repository creation):

```bash
gcloud artifacts repositories create workstation \
  --location us-central1 \
  --repository-format docker \
  --description "WorkStation container images" \
  --project workshop-111f1
```

### 2.4 Firebase Authentication settings

1. Enable **Email/Password** in Firebase Console > Authentication >
   Sign-in method.
2. Under Authentication > Settings > Authorized domains, add the production
   Hosting domains and any custom domain.
3. Enable Cloud Messaging and create a Web Push certificate if browser push is
   required; put the public key in `VITE_FIREBASE_VAPID_KEY`.

## 3. Deploy the backend

From the repository root:

```bash
gcloud builds submit . \
  --config Backend/cloudbuild.yaml \
  --project workshop-111f1
```

The pipeline assumes the Artifact Registry repository already exists (see
section 2.3) and performs three steps:

1. Builds `Backend/Dockerfile` and tags the image with the build ID and
   `latest`.
2. Pushes the image to
   `us-central1-docker.pkg.dev/workshop-111f1/workstation/workstation-api`.
3. Deploys Cloud Run `workstation-api` in `us-central1` with:
   - port 8080, 512 MiB memory, 1 vCPU, concurrency 80
   - 3600 s request timeout (long-lived SSE streams)
   - `NODE_ENV=production`, `TRUST_PROXY=true`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`
   - `CORS_ORIGINS` for the Hosting domains
   - the dedicated runtime service account

To change domains, region, or the service name, override the substitutions:

```bash
gcloud builds submit . \
  --config Backend/cloudbuild.yaml \
  --substitutions _CORS_ORIGINS="https://app.example.com,https://workshop-111f1.web.app" \
  --project workshop-111f1
```

Get the service URL:

```bash
gcloud run services describe workstation-api \
  --region us-central1 \
  --project workshop-111f1 \
  --format='value(status.url)'
```

### Manual container verification (optional)

```bash
docker build -t workstation-api:local Backend
docker run --rm -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e FIREBASE_PROJECT_ID=workshop-111f1 \
  -e FIREBASE_STORAGE_BUCKET=workshop-111f1.firebasestorage.app \
  -e CORS_ORIGINS=http://localhost:5000 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/adc.json \
  -v "$PWD/adc.json:/secrets/adc.json:ro" \
  workstation-api:local
```

Never bake `adc.json` into the image or commit it. This command is for local
verification only; Cloud Run supplies ADC automatically.

## 4. Deploy Firestore and Storage configuration

From the repository root:

```bash
firebase deploy \
  --only firestore:rules,firestore:indexes,storage \
  --project workshop-111f1
```

This enforces deny-all client access for Firestore and Storage and creates the
six composite indexes listed in `docs/DATABASE.md`. Deploy indexes before
sending production traffic; missing indexes cause query failures.

## 5. Build and deploy the frontend

### 5.1 Production environment

Create `Frontend/.env.production.local` (gitignored) from
`Frontend/.env.example` and set the Firebase web app values:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=workshop-111f1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=workshop-111f1
VITE_FIREBASE_STORAGE_BUCKET=workshop-111f1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
VITE_USE_FIREBASE_EMULATOR=false
VITE_API_BASE=/api/v1
```

All `VITE_*` values are embedded in the browser bundle. They are public client
configuration, not secrets. Never place a service-account key, private API key,
or server credential in a `VITE_*` variable.

### 5.2 Deploy

```bash
firebase deploy --only hosting --project workshop-111f1
```

`firebase.json` sets `hosting.predeploy` to
`npm --prefix Frontend run build`, so the SPA is rebuilt before upload. The
Hosting public directory is `Frontend/dist`.

Hosting serves:

- `/api/**` as a rewrite to Cloud Run `workstation-api` in `us-central1`.
- All other paths as `/index.html` for client-side routing.
- Security headers, no-cache for `index.html`, and immutable caching for
  `/assets/**`.

The backend CORS allowlist in `Backend/cloudbuild.yaml` must contain the exact
Hosting origins, including any custom domain. If you change domains, update
`_CORS_ORIGINS` and redeploy the backend.

## 6. Post-deployment verification

Replace `<host>` with `workshop-111f1.web.app` or your custom domain.

```bash
# Liveness through the Hosting rewrite
curl -i https://<host>/api/health

# Readiness (Firestore, Auth, Storage initialized)
curl -i https://<host>/api/health/ready

# Unauthenticated access must be rejected
curl -i https://<host>/api/v1/workspaces

# Cloud Run direct URL (bypasses Hosting)
curl -i https://<cloud-run-url>/api/health
```

In the browser:

1. Register or sign in with a test account.
2. Create a workspace, project, channel, board, and issue.
3. Move a card and confirm the issue status changes.
4. Upload an attachment and download it (signed URL).
5. Convert a chat message into an issue.
6. Open a second browser session and confirm message updates arrive.
7. Verify notifications and the activity feed.
8. Check both light and dark themes.

For SSE, confirm the Hosting rewrite streams events:

```bash
curl -N \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Accept: text/event-stream" \
  "https://<host>/api/v1/channels/<channelId>/events"
```

You should see `event: ready` immediately and `: keep-alive` comments every
25 seconds. If your Hosting layer buffers the stream, set `VITE_API_BASE` to
the Cloud Run URL, add that origin to `CORS_ORIGINS`, and rebuild the frontend.
Bearer tokens still authenticate requests directly.

## 7. Logging and monitoring

The backend writes structured JSON to stdout in production. Each entry includes
`severity` (mapped for Cloud Logging), `timestamp`, `service`, and message
metadata. View logs:

```bash
gcloud run services logs read workstation-api \
  --region us-central1 \
  --project workshop-111f1 \
  --limit 100
```

Recommended monitoring:

- Uptime check on `https://<host>/api/health` (liveness, no Firebase calls).
- Alert on Cloud Run 5xx rate and request latency.
- Log-based alert for `severity>=ERROR` on the `workstation-api` service.
- Alert when instance count reaches the configured maximum (10).
- Firestore usage and Storage egress dashboards.

Cloud Run already records request logs. Application error logs include the
request ID (`requestId`) derived from a validated `X-Request-Id` header or a
generated UUID, so they can be correlated with client reports. Set
`LOG_LEVEL=http` (or `debug`) to also emit one application log line per request.

## 8. Rollback

Cloud Run keeps prior revisions:

```bash
gcloud run revisions list --service workstation-api --region us-central1

gcloud run services update-traffic workstation-api \
  --region us-central1 \
  --to-revisions <revision-name>=100
```

Hosting releases can be rolled back in Firebase Console > Hosting > Release
history. Firestore rules and indexes are also versioned by deployment; revert
the files in git and redeploy.

## 9. Operational notes and caveats

- **Cloud Run is public (`--allow-unauthenticated`).** Authentication is
  enforced by Express using Firebase ID tokens. Cloud Run IAM cannot validate
  Firebase tokens. Keep CORS restricted to known origins and keep every API
  route authenticated.
- **Rate limits are per instance.** `express-rate-limit` uses in-memory state,
  so limits scale with the number of Cloud Run instances. Use Cloud Armor or a
  shared store only if a global limit becomes necessary.
- **Cold starts.** `--min-instances=0` minimizes cost but adds latency after
  idle periods. Set `--min-instances=1` for a latency-sensitive deployment.
- **SSE and Hosting.** Verify streaming end-to-end; the fallback is the direct
  Cloud Run URL described in section 6.
- **Firestore deletion is not cascading.** Deleting a workspace or project
  document does not remove its subcollections. See `docs/HANDOVER.md`.
- **Secrets.** The repository contains no credentials. If a key-based setup is
  ever required, store the key in Secret Manager and mount it with
  `--set-secrets`; never commit it or copy it into the image.
- **Indexes.** A new query that requires a composite index fails in production
  until the index is added to `firestore.indexes.json` and deployed.
- **CORS values contain commas.** When updating `CORS_ORIGINS` manually, use
  gcloud's alternate delimiter, for example:
  `--update-env-vars=^|^CORS_ORIGINS=https://a.example,https://b.example`.
