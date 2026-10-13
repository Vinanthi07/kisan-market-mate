import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(serverDirectory, "..");
const preferredEnvPath = path.join(serverDirectory, ".env");
const existingEnvPath = path.join(projectDirectory, "src", "server", ".env");
const envPath =
  process.env.DOTENV_CONFIG_PATH ??
  (existsSync(preferredEnvPath) ? preferredEnvPath : existingEnvPath);
dotenv.config({ path: envPath });

const DEFAULT_MODEL = "gemini-3.8-flash";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const analysisSchema = {
  type: "OBJECT",
  properties: {
    cropIdentification: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        notes: { type: "STRING" },
      },
      required: ["name", "notes"],
      propertyOrdering: ["name", "notes"],
    },
    visibleQualityObservations: { type: "ARRAY", items: { type: "STRING" } },
    visibleDefects: { type: "ARRAY", items: { type: "STRING" } },
    estimatedGrade: {
      type: "STRING",
      enum: ["A", "B", "C", "Unable to assess"],
    },
    gradeRationale: { type: "STRING" },
    confidenceLevel: {
      type: "STRING",
      enum: ["High", "Moderate", "Low", "Unable to assess"],
    },
    confidenceRationale: { type: "STRING" },
    recommendedNextSteps: { type: "ARRAY", items: { type: "STRING" } },
    imageSufficient: { type: "BOOLEAN" },
    limitationWarning: { type: "STRING" },
  },
  required: [
    "cropIdentification",
    "visibleQualityObservations",
    "visibleDefects",
    "estimatedGrade",
    "gradeRationale",
    "confidenceLevel",
    "confidenceRationale",
    "recommendedNextSteps",
    "imageSufficient",
    "limitationWarning",
  ],
  propertyOrdering: [
    "cropIdentification",
    "visibleQualityObservations",
    "visibleDefects",
    "estimatedGrade",
    "gradeRationale",
    "confidenceLevel",
    "confidenceRationale",
    "recommendedNextSteps",
    "imageSufficient",
    "limitationWarning",
  ],
};

function safeString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  return (
    mimeType === "image/webp" &&
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  );
}

function normalizeAnalysis(value) {
  if (!value || typeof value !== "object") return null;
  const result = value;
  const cropIdentification = result.cropIdentification;
  const gradeValues = new Set(["A", "B", "C", "Unable to assess"]);
  const confidenceValues = new Set(["High", "Moderate", "Low", "Unable to assess"]);
  const stringArray = (items) =>
    Array.isArray(items)
      ? items
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12)
      : null;

  if (
    !cropIdentification ||
    typeof cropIdentification.name !== "string" ||
    typeof cropIdentification.notes !== "string" ||
    !stringArray(result.visibleQualityObservations) ||
    !stringArray(result.visibleDefects) ||
    !gradeValues.has(result.estimatedGrade) ||
    typeof result.gradeRationale !== "string" ||
    !confidenceValues.has(result.confidenceLevel) ||
    typeof result.confidenceRationale !== "string" ||
    !stringArray(result.recommendedNextSteps) ||
    typeof result.imageSufficient !== "boolean" ||
    typeof result.limitationWarning !== "string"
  ) {
    return null;
  }

  return {
    cropIdentification: {
      name: safeString(cropIdentification.name, 100),
      notes: safeString(cropIdentification.notes, 500),
    },
    visibleQualityObservations: stringArray(result.visibleQualityObservations),
    visibleDefects: stringArray(result.visibleDefects),
    estimatedGrade: result.estimatedGrade,
    gradeRationale: safeString(result.gradeRationale, 1000),
    confidenceLevel: result.confidenceLevel,
    confidenceRationale: safeString(result.confidenceRationale, 500),
    recommendedNextSteps: stringArray(result.recommendedNextSteps),
    imageSufficient: result.imageSufficient,
    limitationWarning: safeString(result.limitationWarning, 1000),
  };
}

function buildPrompt(crop, language) {
  const cropContext = crop
    ? `The farmer thinks the crop may be: ${crop}.`
    : "Identify the crop if possible.";
  return [
    "Inspect the attached crop/produce photograph for a farmer making an initial quality assessment.",
    cropContext,
    `Write all human-readable field values in ${language}.`,
    "Only report details that are visibly supported by this image. Do not claim to diagnose disease, pesticide residues, internal damage, safety, or laboratory quality.",
    "Do not provide a numeric confidence score. Use the qualitative confidence field and explain uncertainty from this image.",
    "Estimate grade A/B/C only as a non-certified visual estimate; otherwise use Unable to assess.",
    "If the image is blurry, dark, distant, obstructed, or otherwise insufficient, set imageSufficient to false, set grade and confidence to Unable to assess as appropriate, and explain what additional photo would help.",
    "Recommendations should be practical and cautious. State that a clear close-up in natural light and inspection of multiple samples may be needed.",
  ].join("\n");
}

function getErrorStatus(error) {
  const status = Number(error?.status ?? error?.code);
  if (status === 429) return 429;
  if ([401, 403].includes(status)) return status;
  if (status === 503 || status === 404) return status;
  if (
    error?.name === "AbortError" ||
    /operation was aborted|timed out/i.test(error?.message || "")
  ) {
    return 503;
  }
  if (status >= 500 && status <= 599) return 502;
  return 502;
}

function getErrorResponse(status, error) {
  if (status === 429) {
    const rawMessage = typeof error?.message === "string" ? error.message : "";
    let providerMessage = rawMessage;
    try {
      const parsed = JSON.parse(rawMessage);
      providerMessage = parsed?.error?.message ?? parsed?.message ?? rawMessage;
    } catch {
      providerMessage = rawMessage;
    }
    if (/free tier|per day/i.test(providerMessage)) {
      const retryAfter = providerMessage.match(/retry in\s+(.+?)(?:\s+or upgrade|[.]|$)/i)?.[1];
      return {
        status,
        code: "AI_RATE_LIMITED",
        message: retryAfter
          ? `Gemini's daily free-tier limit for this model has been reached. Try again in about ${retryAfter}, or check your model limits in Google AI Studio.`
          : "Gemini's daily free-tier limit for this model has been reached. Try again later or check your model limits in Google AI Studio.",
      };
    }
    return {
      status,
      code: "AI_RATE_LIMITED",
      message:
        "The AI service is busy or its usage limit was reached. Wait a moment and try again.",
    };
  }
  if (status === 503) {
    return {
      status,
      code: "AI_TEMPORARILY_UNAVAILABLE",
      message: "Gemini is temporarily unavailable. Please wait briefly and retry the analysis.",
    };
  }
  if (status === 404) {
    return {
      status: 502,
      code: "AI_MODEL_UNAVAILABLE",
      message:
        "The configured Gemini model is unavailable for image analysis. Set GEMINI_MODEL to a currently available Gemini model that supports image input, then restart the server.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      status: 502,
      code: "AI_CONFIGURATION_ERROR",
      message:
        "The AI service could not authorize this request. Check the server API key configuration.",
    };
  }
  return {
    status: 502,
    code: "AI_SERVICE_UNAVAILABLE",
    message: "Crop analysis could not be completed right now. Please try again.",
  };
}

function safeErrorSummary(error, apiKey) {
  const message = typeof error?.message === "string" ? error.message : "Unknown provider error";
  return message
    .split(apiKey)
    .join("[redacted]")
    .replace(/([?&](?:key|api_key)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .slice(0, 300);
}

export function createApp({
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || DEFAULT_MODEL,
  fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest",
  allowedOrigins = (process.env.CORS_ORIGINS || DEFAULT_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  generateContent,
  maxRequests = 10,
  rateWindowMs = 15 * 60 * 1000,
} = {}) {
  const app = express();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 2, parts: 3 },
    fileFilter: (_request, file, callback) => {
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        callback(new Error("UNSUPPORTED_IMAGE_TYPE"));
        return;
      }
      callback(null, true);
    },
  });
  const requestCounts = new Map();
  const corsOptions = {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      const error = new Error("Origin is not allowed");
      error.status = 403;
      callback(error);
    },
  };

  app.disable("x-powered-by");
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      geminiConfigured: Boolean(apiKey),
      model,
      fallbackModel,
    });
  });

  app.post(
    "/api/analyze",
    (request, response, next) => {
      const now = Date.now();
      const ip = request.ip || request.socket.remoteAddress || "unknown";
      const entry = requestCounts.get(ip);
      if (!entry || entry.resetAt <= now) {
        requestCounts.set(ip, { count: 1, resetAt: now + rateWindowMs });
      } else if (entry.count >= maxRequests) {
        response.set("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
        response.status(429).json({
          error: {
            code: "REQUEST_RATE_LIMITED",
            message: "Too many image analyses were requested. Please wait and try again.",
          },
        });
        return;
      } else {
        entry.count += 1;
      }
      if (requestCounts.size > 10_000) {
        for (const [key, value] of requestCounts) {
          if (value.resetAt <= now) requestCounts.delete(key);
        }
      }
      next();
    },
    (request, response, next) => {
      upload.single("image")(request, response, (error) => {
        if (!error) {
          next();
          return;
        }
        if (error instanceof multer.MulterError) {
          const tooLarge = error.code === "LIMIT_FILE_SIZE";
          response.status(tooLarge ? 413 : 400).json({
            error: {
              code: tooLarge ? "IMAGE_TOO_LARGE" : "INVALID_UPLOAD",
              message: tooLarge
                ? "Choose an image smaller than 8 MB."
                : "Upload exactly one supported image and try again.",
            },
          });
          return;
        }
        if (error.message === "UNSUPPORTED_IMAGE_TYPE") {
          response.status(415).json({
            error: {
              code: "UNSUPPORTED_IMAGE_TYPE",
              message: "Use a JPEG, PNG, or WebP image.",
            },
          });
          return;
        }
        next(error);
      });
    },
    async (request, response) => {
      const image = request.file;
      if (!image) {
        response.status(400).json({
          error: {
            code: "IMAGE_REQUIRED",
            message: "Select or capture a crop image before analyzing.",
          },
        });
        return;
      }
      if (!apiKey) {
        response.status(503).json({
          error: {
            code: "AI_NOT_CONFIGURED",
            message: "Crop image analysis is not configured on the server.",
          },
        });
        return;
      }
      if (!matchesImageSignature(image.buffer, image.mimetype)) {
        response.status(415).json({
          error: {
            code: "INVALID_IMAGE_CONTENT",
            message: "The selected file does not appear to be a valid JPEG, PNG, or WebP image.",
          },
        });
        return;
      }

      const crop = safeString(request.body?.crop, 80);
      const requestedLanguage = safeString(request.body?.language, 32);
      const language = /^[A-Za-z-]+$/.test(requestedLanguage) ? requestedLanguage : "English";

      try {
        const generate =
          generateContent ??
          (async (input) => {
            const client = new GoogleGenAI({
              apiKey,
              httpOptions: {
                timeout: 30_000,
                retryOptions: { attempts: 1, initialDelay: 0.5, maxDelay: 1 },
              },
            });
            return client.interactions.create(
              {
                model: input.model,
                input: [
                  { type: "text", text: buildPrompt(input.crop, input.language) },
                  {
                    type: "image",
                    mime_type: input.mimeType,
                    data: input.data,
                  },
                ],
                response_format: {
                  type: "text",
                  mime_type: "application/json",
                  schema: analysisSchema,
                },
                store: false,
              },
              {
                timeout_ms: 30_000,
                maxRetries: 0,
              },
            );
          });
        const input = {
          mimeType: image.mimetype,
          data: image.buffer.toString("base64"),
          crop,
          language,
        };
        let analyzedModel = model;
        let result;
        try {
          result = await generate({ ...input, model });
        } catch (error) {
          const status = getErrorStatus(error);
          if (![429, 503].includes(status) || model === fallbackModel) throw error;
          console.warn("Primary Gemini model is busy or quota-limited; retrying with fallback.", {
            model,
            fallbackModel,
            status,
          });
          analyzedModel = fallbackModel;
          result = await generate({ ...input, model: fallbackModel });
        }
        const text = result?.output_text ?? result?.text;
        if (typeof text !== "string" || !text.trim()) {
          response.status(502).json({
            error: {
              code: "INVALID_AI_RESPONSE",
              message: "The AI returned an empty analysis. Please try a clearer image.",
            },
          });
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          response.status(502).json({
            error: {
              code: "INVALID_AI_RESPONSE",
              message: "The AI response could not be read. Please retry the analysis.",
            },
          });
          return;
        }
        const analysis = normalizeAnalysis(parsed);
        if (!analysis) {
          response.status(502).json({
            error: {
              code: "INVALID_AI_RESPONSE",
              message: "The AI response was incomplete. Please retry the analysis.",
            },
          });
          return;
        }
        response.json({
          analysis,
          meta: {
            model: analyzedModel,
            analyzedAt: new Date().toISOString(),
            source: "gemini",
            disclaimer:
              "AI visual estimate only. This is not a laboratory test, certified market grade, food-safety assessment, or agricultural diagnosis.",
          },
        });
      } catch (error) {
        const status = getErrorStatus(error);
        const safeResponse = getErrorResponse(status, error);
        console.error("Crop image analysis failed", {
          status: Number(error?.status ?? error?.code) || "unknown",
          message: safeErrorSummary(error, apiKey),
        });
        response.status(safeResponse.status).json({
          error: { code: safeResponse.code, message: safeResponse.message },
        });
      }
    },
  );

  app.use((error, _request, response, _next) => {
    const status = Number(error?.status) || 500;
    response.status(status).json({
      error: {
        code: status === 403 ? "ORIGIN_NOT_ALLOWED" : "INTERNAL_SERVER_ERROR",
        message:
          status === 403
            ? "This frontend origin is not allowed to call the crop analysis service."
            : "The crop analysis service encountered an unexpected error.",
      },
    });
  });

  return app;
}

const app = createApp();
const port = Number.parseInt(process.env.PORT || "3001", 10);
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  app.listen(port, () => {
    console.log(`Kisan Mandi AI service listening on http://localhost:${port}`);
  });
}
