# Install dependencies only when needed
FROM node:lts-slim AS deps

WORKDIR /opt/app
COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

FROM node:lts-slim AS builder

ENV NODE_ENV=production
WORKDIR /opt/app
COPY . .
COPY --from=deps /opt/app/node_modules ./node_modules
RUN rm -rf orval.config.ts cypress.config.ts cypress/ docs/ scripts/ lighthouse-reports/ playwright-report/ && npm run build

# Production image, copy all the files and run next
FROM node:lts-slim AS runner

WORKDIR /opt/app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 --ingroup nextjs nextjs

COPY --from=builder --chown=nextjs:nextjs /opt/app/next.config.js ./
COPY --from=builder --chown=nextjs:nextjs /opt/app/public ./public
COPY --from=builder --chown=nextjs:nextjs /opt/app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /opt/app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /opt/app/package.json ./

USER nextjs
EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
