# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/config ./packages/config
COPY apps/api ./apps/api

RUN pnpm --filter @xo/database build
RUN pnpm --filter @xo/shared build
RUN pnpm --filter @xo/api build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
