import dotenv from "dotenv";
import mongoose from "mongoose";

import { app } from "./app";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
let mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  dotenv.config({ path: ".env.example" });
  mongoUri = process.env.MONGODB_URI;
}

if (!mongoUri) {
  throw new Error("MONGODB_URI is not set. Create a .env file with MONGODB_URI.");
}

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
