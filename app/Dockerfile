# syntax=docker/dockerfile:1
FROM node:22-alpine
RUN apk add --no-cache vips-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
