# Sử dụng Node.js bản Lightweight LTS
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Sao chép file package.json và package-lock.json để cài dependencies
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Sao chép toàn bộ mã nguồn backend vào container
COPY . .

# Mở cổng 3000
EXPOSE 3000

# Lệnh khởi chạy server Node.js
CMD ["npm", "run", "dev"]
