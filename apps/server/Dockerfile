FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile --filter @v-edfinance/server

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY apps/server ./apps/server
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

WORKDIR /app/apps/server
RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy built files
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/drizzle ./drizzle

EXPOSE 4000

CMD ["node", "dist/index.js"]
