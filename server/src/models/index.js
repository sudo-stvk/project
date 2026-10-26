import mongoose from "mongoose";
const { Schema, model } = mongoose;
const owner = { type: Schema.Types.ObjectId, ref: "User", required: true };
const userSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    settings: {
      animationIntensity: {
        type: String,
        enum: ["off", "subtle", "full"],
        default: "subtle",
      },
      reducedMotion: { type: Boolean, default: false },
      nodeLabels: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);
const noteSchema = new Schema(
  {
    owner,
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, default: "", maxlength: 100000 },
    tags: [String],
    color: { type: String, default: "#A78BFA" },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    demoKey: String,
  },
  { timestamps: true },
);
noteSchema.index({ owner: 1, updatedAt: -1 });
noteSchema.index({ owner: 1, tags: 1 });
noteSchema.index(
  { owner: 1, title: "text", content: "text", tags: "text" },
  { weights: { title: 5, tags: 3, content: 1 } },
);
noteSchema.index(
  { owner: 1, demoKey: 1 },
  { unique: true, partialFilterExpression: { demoKey: { $type: "string" } } },
);
export const relationTypes = [
  "relates_to",
  "supports",
  "extends",
  "contradicts",
];
const linkSchema = new Schema(
  {
    owner,
    sourceNote: { type: Schema.Types.ObjectId, ref: "Note", required: true },
    targetNote: { type: Schema.Types.ObjectId, ref: "Note", required: true },
    relationType: { type: String, enum: relationTypes, default: "relates_to" },
    label: { type: String, maxlength: 100, default: "" },
  },
  { timestamps: true },
);
linkSchema.index({ owner: 1, sourceNote: 1 });
linkSchema.index({ owner: 1, targetNote: 1 });
linkSchema.index(
  { owner: 1, sourceNote: 1, targetNote: 1, relationType: 1 },
  { unique: true },
);
const layoutSchema = new Schema(
  {
    owner,
    positions: [
      {
        _id: false,
        noteId: { type: Schema.Types.ObjectId, ref: "Note" },
        x: Number,
        y: Number,
        pinned: Boolean,
      },
    ],
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
  },
  { timestamps: true },
);
layoutSchema.index({ owner: 1 }, { unique: true });
const activitySchema = new Schema(
  {
    owner,
    action: String,
    entityType: String,
    entityId: Schema.Types.ObjectId,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
activitySchema.index({ owner: 1, createdAt: -1 });
export const User = model("User", userSchema);
export const Note = model("Note", noteSchema);
export const Link = model("Link", linkSchema);
export const GraphLayout = model("GraphLayout", layoutSchema);
export const Activity = model("Activity", activitySchema);
