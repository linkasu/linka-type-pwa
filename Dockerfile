# Build static renderer assets (landing + app entrypoint)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --ignore-scripts

COPY . .

RUN npm run build:renderer

FROM nginx:1.27-alpine
COPY --from=builder /app/dist/renderer /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
