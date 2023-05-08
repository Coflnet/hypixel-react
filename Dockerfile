# Install dependencies only when needed
FROM node:16.20-bullseye AS deps

WORKDIR /opt/app
COPY package*.json ./
RUN npm ci

FROM node:16.20-bullseye AS builder

ENV NODE_ENV=production
WORKDIR /opt/app
COPY . .
COPY --from=deps /opt/app/node_modules ./node_modules
RUN npm run build

# Production image, copy all the files and run next
FROM node:16.20-bullseye AS runner

ARG X_TAG
WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=builder /opt/app/next.config.js ./
COPY --from=builder /opt/app/public ./public
COPY --from=builder /opt/app/.next ./.next
COPY --from=builder /opt/app/node_modules ./node_modules
CMD ["node_modules/.bin/next", "start"]
