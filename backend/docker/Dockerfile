FROM node:lts
ENV TZ=Asia/Tokyo

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["/bin/bash"]
