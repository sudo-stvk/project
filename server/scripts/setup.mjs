import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
const env = new URL("../.env", import.meta.url);
if (existsSync(env)) console.log("server/.env already exists; kept unchanged.");
else {
  const example = readFileSync(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );
  writeFileSync(
    env,
    example.replace(
      "replace_with_secure_random_secret",
      randomBytes(48).toString("hex"),
    ),
    { flag: "wx" },
  );
  console.log("Created server/.env with a random session secret.");
}
