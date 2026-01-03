"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
dotenv_1.default.config();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    dotenv_1.default.config({ path: ".env.example" });
    mongoUri = process.env.MONGODB_URI;
}
if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Create a .env file with MONGODB_URI.");
}
mongoose_1.default
    .connect(mongoUri)
    .then(() => {
    app_1.app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
})
    .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
