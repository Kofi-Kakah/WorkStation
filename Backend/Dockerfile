# Production image for the WorkStation API (Express + Firebase Admin).
# Cloud Run injects PORT=8080 by default; the server reads it from env.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Install only runtime dependencies; devDependencies are not needed at runtime.
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

# Run as an unprivileged user. Cloud Run mounts application credentials
# through the metadata server, so no key material is baked into the image.
RUN addgroup -g 1001 -S nodejs \
  && adduser -S -u 1001 -G nodejs nodeapp

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src

USER nodeapp
EXPOSE 8080

# The liveness endpoint does not touch Firebase.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

CMD ["node", "src/server.js"]
