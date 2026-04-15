import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());
  
  const interactions = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'interactions.json'), 'utf-8'));

  // API routes
  app.get("/api/drug-interaction", (req, res) => {
    const { drug1, drug2 } = req.query;
    if (!drug1 || !drug2) return res.status(400).json({ error: "Missing drugs" });

    const d1 = (drug1 as string).toLowerCase().trim();
    const d2 = (drug2 as string).toLowerCase().trim();

    const match = interactions.find((i: any) => 
      (i.drug1.toLowerCase() === d1 && i.drug2.toLowerCase() === d2) ||
      (i.drug1.toLowerCase() === d2 && i.drug2.toLowerCase() === d1)
    );

    if (match) {
      res.json({
        status: "Interaction Found",
        severity: match.severity,
        description: match.description
      });
    } else {
      res.json({
        status: "No Major Risk Found",
        severity: "Low",
        description: "No interaction in dataset"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
