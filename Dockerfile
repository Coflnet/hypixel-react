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

# Apply OS security patches (e.g. libgnutls30 CVEs) on top of the base image.
# node:lts-slim is Debian-based; apt upgrade pulls in the latest point-release
# fixes without changing the Debian major version.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Strip npm + corepack from the runtime image — they are not needed to
# run `next start` and removing them eliminates CVEs bundled with npm
# (e.g. undici CVE-2026-12151) as well as reducing the attack surface.
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn-v1.22.22

RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 --ingroup nextjs nextjs

COPY --from=builder --chown=nextjs:nextjs /opt/app/next.config.js ./
COPY --from=builder --chown=nextjs:nextjs /opt/app/public ./public
COPY --from=builder --chown=nextjs:nextjs /opt/app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /opt/app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /opt/app/package.json ./
COPY --from=builder --chown=nextjs:nextjs /opt/app/app/wiki/docs ./app/wiki/docs

USER nextjs
EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
