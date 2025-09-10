FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 5173

ENV TZ=Asia/Tokyo