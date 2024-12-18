# Build stage
FROM node:20-alpine as build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM caddy:2.8.4-alpine

# Copy the Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built files from build stage
COPY --from=build-stage /app/dist /srv

EXPOSE 80
EXPOSE 443
