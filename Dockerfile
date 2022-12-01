# Install dependencies only when needed
FROM node:18.6-bullseye AS deps

WORKDIR /opt/app
COPY package*.json ./
RUN npm ci

FROM node:18.6-bullseye AS builder

ENV NODE_ENV=production
WORKDIR /opt/app
COPY . .
COPY --from=deps /opt/app/node_modules ./node_modules
RUN npm run build

# Production image, copy all the files and run next
FROM node:18.6-bullseye AS runner

ARG X_TAG
WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=builder /opt/app/next.config.js ./
COPY --from=builder /opt/app/public ./public
COPY --from=builder /opt/app/.next ./.next
COPY --from=builder /opt/app/node_modules ./node_modules
COPY --from=builder /opt/app/next.config.js ./

CMD ["node_modules/.bin/next", "start"]
