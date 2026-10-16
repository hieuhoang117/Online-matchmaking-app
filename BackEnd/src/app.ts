import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from './routes/auth.routes.js'

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));

app.use('/api/auth', authRoutes);