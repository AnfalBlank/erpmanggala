import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import './db/seed.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/index.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

const PORT = 3002;
app.listen(PORT, () => console.log(`🚀 ERP Manggala server running on port ${PORT}`));
