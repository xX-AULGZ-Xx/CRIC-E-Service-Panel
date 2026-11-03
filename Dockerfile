FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (with retry in case of transient DNS hiccups)
RUN npx prisma generate || (sleep 2 && npx prisma generate) || (sleep 5 && npx prisma generate)

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install su-exec for safe privilege dropping from root entrypoint
RUN apk add --no-cache libc6-compat su-exec

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy app files with proper nextjs ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copy and setup entrypoint script
COPY docker/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app/data /app/public && \
    chmod -R 777 /app/data /app/public/uploads

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
