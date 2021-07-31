FROM node:16-alpine3.11 as frontend

WORKDIR /build
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.21.1-alpine

COPY --from=frontend /build/build /usr/share/nginx/html