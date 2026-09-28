const express = require('express');
const cors = require('cors');
const productRouter = require('./routes/productRouter');
const userRouter = require('./routes/userRouter');
const { unknownEndpoint, errorHandler, requestLogger } = require('./middleware/customMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/products', productRouter);
app.use('/api/users', userRouter);

// Error handling
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
