import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { check, string, boolean } from "../validators/input.js";
import { HttpError } from "../utils/errors.js";
export const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  settings: user.settings,
  createdAt: user.createdAt,
});
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
export function setSession(res, user) {
  res.cookie(
    "neuron_session",
    jwt.sign({}, process.env.JWT_SECRET, {
      subject: String(user._id),
      expiresIn: "7d",
      algorithm: "HS256",
    }),
    cookieOptions(),
  );
}
function credentials(body) {
  const email = string(body.email, "Email", 254, 3).toLowerCase();
  check(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Enter a valid email address",
  );
  check(
    typeof body.password === "string" &&
      body.password.length >= 10 &&
      Buffer.byteLength(body.password) <= 72,
    "Password must be at least 10 characters and at most 72 UTF-8 bytes",
  );
  return { email, password: body.password };
}
export async function register(body) {
  const { email, password } = credentials(body);
  const name = string(body.name, "Name", 80, 1);
  return User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });
}
const dummyHash = bcrypt.hashSync("neuron-dummy-password-for-timing", 12);
export async function login(body) {
  const { email, password } = credentials(body);
  const user = await User.findOne({ email }).select("+passwordHash");
  const matches = await bcrypt.compare(
    password,
    user?.passwordHash || dummyHash,
  );
  if (!user || !matches)
    throw new HttpError(401, "Email or password is incorrect");
  return user;
}
export async function updateProfile(user, body) {
  if (body.name !== undefined) user.name = string(body.name, "Name", 80, 1);
  if (body.settings !== undefined) {
    check(
      body.settings &&
        typeof body.settings === "object" &&
        !Array.isArray(body.settings),
      "Invalid settings",
    );
    const s = body.settings;
    if (s.animationIntensity !== undefined) {
      check(
        ["off", "subtle", "full"].includes(s.animationIntensity),
        "Invalid animation intensity",
      );
      user.settings.animationIntensity = s.animationIntensity;
    }
    for (const key of ["reducedMotion", "nodeLabels"])
      if (s[key] !== undefined) user.settings[key] = boolean(s[key], key);
  }
  await user.save();
  return publicUser(user);
}
