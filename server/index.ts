import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  const isProd = process.env.NODE_ENV === "production";

  // In production, dist/index.js is in dist/ and public files are in dist/public/
  // In dev, server/index.ts is in server/ and public files are in client/public/
  const publicPath = isProd
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "client", "public");

  const uploadsDir = isProd
    ? path.resolve(__dirname, "..", "uploads")
    : path.resolve(__dirname, "..", "client", "public", "uploads");

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) { res.status(400).json({ error: "No file" }); return; }
    res.json({ filename: req.file.filename, url: `/uploads/${req.file.filename}` });
  });

  app.delete("/api/upload/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ ok: true });
  });

  app.use("/uploads", express.static(uploadsDir));
  app.use(express.static(publicPath));

  app.get("*", (_req, res) => {
    const indexPath = path.join(publicPath, "index.html");
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send("Not found");
  });

  const port = Number(process.env.PORT) || 3001;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
