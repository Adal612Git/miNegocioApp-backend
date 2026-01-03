"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongo;
beforeAll(async () => {
    jest.setTimeout(30000);
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
    mongo = await mongodb_memory_server_1.MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongo.getUri();
    await mongoose_1.default.connect(uri);
});
afterAll(async () => {
    await mongoose_1.default.disconnect();
    if (mongo) {
        await mongo.stop();
    }
});
afterEach(async () => {
    if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
        const collections = await mongoose_1.default.connection.db.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
    }
});
