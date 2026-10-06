const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Swagger / OpenAPI UI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'VNU Living & Expense Hub API Docs',
  customCss: '.swagger-ui .topbar { display: block; }'
}));

// Route phục vụ raw OpenAPI spec JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Mount API routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với API VNU Campus Living & Shared Expense Hub',
    docs: '/api/docs',
    spec: '/api/docs.json',
    health: '/api/health',
    version: '1.0.0-baseline'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy đường dẫn: ${req.method} ${req.originalUrl}`,
    error: 'ROUTE_NOT_FOUND'
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
