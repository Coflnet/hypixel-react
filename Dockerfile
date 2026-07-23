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

# Production image — Google distroless: no shell, no package manager,
# no npm. Ships only the Node.js runtime + minimal Debian libs.
# https://github.com/GoogleContainerTools/distroless/blob/main/nodejs/README.md
FROM gcr.io/distroless/nodejs24-debian13 AS runner

WORKDIR /opt/app
ARG APP_VERSION
ENV NODE_ENV=production
ENV APP_VERSION=${APP_VERSION}

COPY --from=builder --chown=nonroot:nonroot /opt/app/next.config.js ./
COPY --from=builder --chown=nonroot:nonroot /opt/app/public ./public
COPY --from=builder --chown=nonroot:nonroot /opt/app/.next ./.next
COPY --from=builder --chown=nonroot:nonroot /opt/app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /opt/app/package.json ./
COPY --from=builder --chown=nonroot:nonroot /opt/app/app/wiki/docs ./app/wiki/docs

USER nonroot
EXPOSE 3000

# Distroless entrypoint is "node", so CMD args are passed to node directly:
#   node node_modules/.bin/next start
CMD ["node_modules/.bin/next", "start"]
