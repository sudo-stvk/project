import mongoose from "mongoose";
export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri)
    throw new Error("MONGODB_URI is required. Copy .env.example to .env.");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await Promise.all(
      Object.values(mongoose.models).map((model) => model.init()),
    );
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
}
