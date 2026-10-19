import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import uploadRoutes from './routes/mobile/uploadRoute.js'
import notificationRoutes from './routes/notification.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

export default app;