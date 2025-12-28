// Local development server for testing API endpoints
// Run this with: node server.js

import express from 'express';
import cors from 'cors';
import downloadHandler from './api/download.js';
import proxyHandler from './api/proxy.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.post('/api/download', (req, res) => {
    downloadHandler(req, res);
});

app.get('/api/proxy', (req, res) => {
    proxyHandler(req, res);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'API server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`📡 Test endpoint: http://localhost:${PORT}/health`);
});
