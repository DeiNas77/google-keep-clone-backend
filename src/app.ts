import express from "express";
import type { Request, Response } from "express";

import { PORT_APP } from "./constants.js";
import { routes } from "./routes/index.js";

const app = express();

app.set("port", PORT_APP || 4000);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes

routes(app);

app.all("/status", (_req: Request, res: Response) => {
  res.json({
    status: true,
    message: "The server is active and running",
  });
});

app.all("/*rest", (_req: Request, res: Response) => {
  res.status(404).json({ message: "Requested source not found - 404" });
});

export default app;
