# ======================
# 1. Base image
# ======================
FROM node:20-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build step (if using TS or bundlers, optional)
# RUN npm run build

# ======================
# 2. Production image
# ======================
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy node_modules and app
COPY --from=build /usr/src/app ./

# Expose port
EXPOSE 5000

# Default command
CMD ["node", "src/server.js"]
