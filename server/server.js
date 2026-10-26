import "dotenv/config";
import { app } from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";
import mongoose from "mongoose";
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 40 ||
  process.env.JWT_SECRET.includes("replace_with")
)
  throw new Error(
    "Set JWT_SECRET to a random secret of at least 40 characters in server/.env",
  );
try {
  await connectDatabase();
  const server = app.listen(process.env.PORT || 5000, "127.0.0.1", () =>
    console.log(
      `NEURON API ready at http://localhost:${process.env.PORT || 5000}`,
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      }),
    );
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
}
