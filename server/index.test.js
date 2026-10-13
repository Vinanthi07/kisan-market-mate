import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createApp } from "./index.js";

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

const successfulAnalysis = {
  cropIdentification: { name: "Tomato", notes: "The visible produce resembles tomato." },
  visibleQualityObservations: ["Red skin is visible."],
  visibleDefects: [],
  estimatedGrade: "B",
  gradeRationale: "Some surface variation is visible.",
  confidenceLevel: "Moderate",
  confidenceRationale: "Only one angle is available.",
  recommendedNextSteps: ["Inspect several fruits in natural light."],
  imageSufficient: true,
  limitationWarning: "Internal condition cannot be seen.",
};

let server;
let baseUrl;

async function startServer(options = {}) {
  const app = createApp({
    apiKey: "test-key",
    allowedOrigins: ["http://localhost:8080"],
    generateContent: async () => ({ text: JSON.stringify(successfulAnalysis) }),
    ...options,
  });
  server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function postImage() {
  const form = new FormData();
  form.append("image", new Blob([pngSignature], { type: "image/png" }), "crop.png");
  form.append("crop", "tomato");
  form.append("language", "English");
  return fetch(`${baseUrl}/api/analyze`, { method: "POST", body: form });
}

beforeEach(async () => {
  await startServer();
});

afterEach(async () => {
  await new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

describe("crop quality API", () => {
  it("reports health without exposing the configured API key", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.status, "ok");
    assert.equal(payload.geminiConfigured, true);
    assert.equal(JSON.stringify(payload).includes("test-key"), false);
  });

  it("validates that an image is present", async () => {
    const response = await fetch(`${baseUrl}/api/analyze`, { method: "POST" });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "IMAGE_REQUIRED");
  });

  it("sends the validated image to the injected Gemini call and returns its structured result", async () => {
    let calledWith;
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
    await startServer({
      generateContent: async (input) => {
        calledWith = input;
        return { text: JSON.stringify(successfulAnalysis) };
      },
    });

    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(calledWith.mimeType, "image/png");
    assert.equal(calledWith.data, pngSignature.toString("base64"));
    assert.equal(calledWith.crop, "tomato");
    assert.equal(payload.analysis.estimatedGrade, "B");
    assert.equal(payload.meta.source, "gemini");
    assert.match(payload.meta.disclaimer, /not a laboratory test/);
  });

  it("retries with the lightweight model when the primary model is quota-limited", async () => {
    const modelsTried = [];
    await new Promise((resolve) => server.close(resolve));
    await startServer({
      model: "gemini-3.8-flash",
      fallbackModel: "gemini-flash-lite-latest",
      generateContent: async ({ model }) => {
        modelsTried.push(model);
        if (model === "gemini-3.8-flash") {
          const limited = new Error("primary model quota reached");
          limited.status = 429;
          throw limited;
        }
        return { output_text: JSON.stringify(successfulAnalysis) };
      },
    });

    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(modelsTried, ["gemini-3.8-flash", "gemini-flash-lite-latest"]);
    assert.equal(payload.meta.model, "gemini-flash-lite-latest");
  });

  it("rejects an image whose content does not match its declared image type", async () => {
    const form = new FormData();
    form.append("image", new Blob(["not a png"], { type: "image/png" }), "fake.png");
    const response = await fetch(`${baseUrl}/api/analyze`, { method: "POST", body: form });
    const payload = await response.json();
    assert.equal(response.status, 415);
    assert.equal(payload.error.code, "INVALID_IMAGE_CONTENT");
  });

  it("returns a clear service-unavailable response when no Gemini key is configured", async () => {
    await new Promise((resolve) => server.close(resolve));
    await startServer({ apiKey: "" });
    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.equal(payload.error.code, "AI_NOT_CONFIGURED");
  });

  it("maps Gemini rate limits to a retryable 429 response", async () => {
    await new Promise((resolve) => server.close(resolve));
    const limited = new Error("provider limit");
    limited.status = 429;
    await startServer({ generateContent: async () => Promise.reject(limited) });
    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 429);
    assert.equal(payload.error.code, "AI_RATE_LIMITED");
  });

  it("explains when Gemini's daily free-tier limit has been reached", async () => {
    await new Promise((resolve) => server.close(resolve));
    const limited = new Error(
      JSON.stringify({
        error: {
          message:
            "Rate limit exceeded (limit: 20 requests per day on Free Tier). Please retry in 2h2m22s or upgrade your tier.",
        },
      }),
    );
    limited.status = 429;
    await startServer({ generateContent: async () => Promise.reject(limited) });
    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 429);
    assert.match(payload.error.message, /daily free-tier limit/);
    assert.match(payload.error.message, /2h2m22s/);
  });

  it("reports Gemini outages as retryable service-unavailable errors", async () => {
    await new Promise((resolve) => server.close(resolve));
    const unavailable = new Error("provider unavailable");
    unavailable.status = 503;
    await startServer({ generateContent: async () => Promise.reject(unavailable) });
    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.equal(payload.error.code, "AI_TEMPORARILY_UNAVAILABLE");
  });

  it("reports aborted Gemini requests as retryable service-unavailable errors", async () => {
    await new Promise((resolve) => server.close(resolve));
    const aborted = new Error("This operation was aborted");
    aborted.code = 20;
    await startServer({ generateContent: async () => Promise.reject(aborted) });
    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.equal(payload.error.code, "AI_TEMPORARILY_UNAVAILABLE");
  });

  it("explains when the configured Gemini model is unavailable", async () => {
    await new Promise((resolve) => server.close(resolve));
    const missingModel = new Error("model not found");
    missingModel.status = 404;
    await startServer({ generateContent: async () => Promise.reject(missingModel) });
    const response = await postImage();
    const payload = await response.json();
    assert.equal(response.status, 502);
    assert.equal(payload.error.code, "AI_MODEL_UNAVAILABLE");
  });
});
