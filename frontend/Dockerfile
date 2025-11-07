# Multi-stage build for FinSmart Frontend (Vite React)
# Stage 1: Build static assets
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
