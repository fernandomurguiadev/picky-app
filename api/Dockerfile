# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built app
COPY --from=builder /app/dist ./dist

# Expose port (default 1000)
EXPOSE 1000

# Start command
CMD ["node", "dist/main"]
