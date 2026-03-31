import Groq from "groq-sdk";
import { env } from "../../config/env.config.js";

export const groq = new Groq({apiKey: env.GROQ_API_KEY})