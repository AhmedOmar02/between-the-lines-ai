import { Schema, model } from "mongoose";

const interpretationSchema = new Schema(
  {
    meaning: { type: String, required: true },
    explanation: { type: String, required: true },
    tone: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const analysisSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  sentence: {
    type: String,
    required: true,
  },
  context: {
    relationshipType: { type: String },
    channel: { type: String },
    background: { type: String },
  },
  interpretations: {
    type: [interpretationSchema],
    required: true,
  },
  dominantTone: {
    type: String,
    required: true,
  },
  processingTimeMs: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model("Analysis", analysisSchema);
