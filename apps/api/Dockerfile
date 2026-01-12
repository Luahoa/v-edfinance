# Stage 1: Base image
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app
# Install build dependencies for sharp
RUN apk add --no-cache python3 make g++ vips-dev

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Copy api package.json
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies for the whole workspace but filtered for api
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter=api...

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Create docs directory for ERD generator
RUN mkdir -p /app/apps/api/docs

# Generate Prisma client
RUN pnpm --filter api exec prisma generate --schema=prisma/schema.prisma

# Build the app
RUN pnpm --filter api build

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma and glibc compatibility for onnxruntime
RUN apk add --no-cache openssl gcompat

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy only necessary files
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Start the application (skip migrations for now - run manually or use existing DB)
CMD ["node", "apps/api/dist/src/main"]
