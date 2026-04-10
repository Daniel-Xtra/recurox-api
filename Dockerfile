# Base image
FROM node:20-alpine AS base

# Install pnpm and build dependencies
RUN apk add --no-cache python3 make g++ \
    && npm install -g pnpm

# Stage 1: Build
FROM base AS build

WORKDIR /app

# Copy configuration files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine AS runtime

# Install pnpm and tini for signal handling
RUN apk add --no-cache tini \
    && npm install -g pnpm

WORKDIR /app

# Copy production package items
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# Set higher security with non-root user
USER node

# Expose the API port
EXPOSE 3000

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/main"]
