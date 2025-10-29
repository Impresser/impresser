# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build

# Production Stage
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
CMD ["pnpm", "start"]