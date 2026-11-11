FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
CMD ["sh", "-c", "node src/db/migrate.js && node src/db/seed.js && node src/index.js"]
