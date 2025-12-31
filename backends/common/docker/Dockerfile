FROM node:24-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080

RUN npm run build

ENV TZ=Asia/Tokyo

CMD ["sh", "-c", "npm run db:setup && npm run start"]