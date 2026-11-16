require('dotenv').config();
const app = require('./app');
const { initDB, pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('🔄 Đang kết nối tới PostgreSQL...');
    await initDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📌 API Health Check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async () => {
      console.log('Đang dừng server...');
      server.close(async () => {
        await pool.end();
        console.log('Đã ngắt kết nối cơ sở dữ liệu.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error);
    process.exit(1);
  }
}

startServer();
