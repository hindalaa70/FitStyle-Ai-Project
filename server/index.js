import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from workspace root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import routes
import tryonRouter from './routes/tryon.js';
import styleRouter from './routes/style.js';
import demoRouter from './routes/demo.js';
import analyzeProductRouter from './routes/analyzeProduct.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Setup large payload limits for base64 human image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Register routes
app.use('/api/tryon', tryonRouter);
app.use('/api/style-advice', styleRouter);
app.use('/api/create-demo', demoRouter);
app.use('/api/analyze-product', analyzeProductRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` FitStyle AI Full-Stack Server Running    `);
  console.log(` Port: ${PORT}                            `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
  console.log(`=========================================`);
});
