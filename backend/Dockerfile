FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
ARG GIT_COMMIT_SHA=not-provided
ENV GIT_COMMIT_SHA=$GIT_COMMIT_SHA
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Keep the superadmin bootstrap runnable as `node bootstrap-superuser.cjs`
# from the workdir; it self-locates the compiled backend under ./dist.
COPY --from=builder /app/bootstrap-superuser.cjs ./bootstrap-superuser.cjs

RUN mkdir -p uploads logs && chown -R appuser:appgroup uploads logs
RUN mkdir -p /app/uploads/events /app/uploads/users && chown -R appuser:appgroup /app/uploads/events /app/uploads/users
USER appuser

EXPOSE 3442


CMD ["node", "dist/server.js"]
