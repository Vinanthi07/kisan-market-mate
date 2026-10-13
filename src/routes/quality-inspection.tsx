import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageUp,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sprout,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Page } from "@/components/AppShell";
import { CROPS, type CropId } from "@/lib/data";
import { LANGS } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

const API_BASE_URL = (import.meta.env.VITE_CROP_AI_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface CropQualityAnalysis {
  cropIdentification: { name: string; notes: string };
  visibleQualityObservations: string[];
  visibleDefects: string[];
  estimatedGrade: "A" | "B" | "C" | "Unable to assess";
  gradeRationale: string;
  confidenceLevel: "High" | "Moderate" | "Low" | "Unable to assess";
  confidenceRationale: string;
  recommendedNextSteps: string[];
  imageSufficient: boolean;
  limitationWarning: string;
}

interface AnalysisResponse {
  analysis?: CropQualityAnalysis;
  meta?: { analyzedAt?: string; disclaimer?: string };
  error?: { code?: string; message?: string };
}

export const Route = createFileRoute("/quality-inspection")({
  head: () => ({
    meta: [
      { title: "AI Crop Quality Inspection | KisanSaathi" },
      {
        name: "description",
        content:
          "Use Gemini to review visible crop quality, freshness and defects from a photograph. Results are AI estimates, not certified grades or diagnoses.",
      },
    ],
  }),
  component: CropQualityInspectionPage,
});

function CropQualityInspectionPage() {
  const { s, t } = useSettings();
  const [cropId, setCropId] = useState<CropId | "">("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CropQualityAnalysis | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!cameraActive) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => {
      if (streamRef.current !== stream) return;
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      video.srcObject = null;
      setCameraActive(false);
      setCameraError(t.cropQualityCameraError);
    });
  }, [cameraActive, t.cropQualityCameraError]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t.cropQualityCameraUnsupported);
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCameraError(
        name === "NotAllowedError" || name === "SecurityError"
          ? t.cropQualityCameraPermission
          : name === "NotFoundError" || name === "NotReadableError"
            ? t.cropQualityCameraUnavailable
            : t.cropQualityCameraError,
      );
      stopCamera();
    }
  };

  const selectImage = (file: File | undefined) => {
    setAnalysis(null);
    setAnalyzedAt(null);
    setAnalysisError(null);
    if (!file) {
      setImage(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImage(null);
      setAnalysisError(t.cropQualityImageUnsupported);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImage(null);
      setAnalysisError(t.cropQualityImageTooLarge);
      return;
    }
    setImage(file);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(t.cropQualityCameraError);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError(t.cropQualityCameraError);
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(t.cropQualityCameraError);
          return;
        }
        selectImage(new File([blob], `crop-inspection-${Date.now()}.jpg`, { type: "image/jpeg" }));
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  };

  const analyzeImage = async () => {
    if (!image) {
      setAnalysisError(t.cropQualityImageRequired);
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    setAnalyzedAt(null);
    const formData = new FormData();
    formData.append("image", image, image.name);
    if (cropId) formData.append("crop", cropId);
    formData.append(
      "language",
      LANGS.find((language) => language.code === s.lang)?.label || "English",
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as AnalysisResponse;
      if (!response.ok) {
        setAnalysisError(payload.error?.message || t.cropQualityAnalysisFailed);
        return;
      }
      if (!payload.analysis) {
        setAnalysisError(t.cropQualityAnalysisFailed);
        return;
      }
      setAnalysis(payload.analysis);
      setAnalyzedAt(payload.meta?.analyzedAt || null);
    } catch (error) {
      console.error("Unable to contact crop inspection backend", error);
      setAnalysisError(t.cropQualityBackendUnavailable);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalyzedAt = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  return (
    <Page>
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="space-y-2 border-b pb-4">
          <div className="flex items-center gap-2">
            <Sprout className="size-6 text-primary" />
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              {t.cropQualityTitle}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t.cropQualityIntro}</p>
        </header>

        <section className="space-y-4 rounded-3xl border bg-card p-4 shadow-2xs sm:p-6">
          <label className="block space-y-1 text-sm">
            <span className="font-semibold text-foreground">{t.cropQualityCropLabel}</span>
            <select
              value={cropId}
              onChange={(event) => setCropId(event.target.value as CropId | "")}
              className="h-11 w-full rounded-xl border bg-background px-3 text-foreground"
            >
              <option value="">—</option>
              {CROPS.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {t[crop.id] || crop.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted"
            >
              <Camera className="size-4 text-primary" />
              {t.cropQualityUseCamera}
            </button>
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted"
            >
              <ImageUp className="size-4 text-primary" />
              {t.cropQualityUpload}
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                selectImage(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t.cropQualityImageTypes}</p>

          {cameraError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {cameraError}
            </p>
          )}

          {cameraActive && (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[min(60vh,32rem)] w-full rounded-2xl bg-black object-contain"
                aria-label={t.cropQualityUseCamera}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                >
                  <Camera className="size-4" />
                  {t.cropQualityTakePhoto}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold text-foreground"
                >
                  <X className="size-4" />
                  {t.cropQualityStopCamera}
                </button>
              </div>
            </div>
          )}

          {previewUrl && image && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{image.name}</p>
                <button
                  type="button"
                  onClick={() => selectImage(undefined)}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-muted"
                  aria-label={t.cropQualityRemoveImage}
                >
                  <X className="size-4" />
                  {t.cropQualityRemoveImage}
                </button>
              </div>
              <img
                src={previewUrl}
                alt={t.cropQualityTitle}
                className="max-h-[min(60vh,32rem)] w-full rounded-2xl border bg-muted object-contain"
              />
            </div>
          )}

          {analysisError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void analyzeImage()}
            disabled={!image || isAnalyzing}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : analysisError && image ? (
              <RefreshCw className="size-4" />
            ) : (
              <Sprout className="size-4" />
            )}
            {isAnalyzing
              ? t.cropQualityAnalyzing
              : analysisError && image
                ? t.cropQualityRetry
                : t.cropQualityAnalyze}
          </button>
        </section>

        <p className="flex items-start gap-2 rounded-2xl border border-amber-300/70 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          {t.cropQualityDisclaimer}
        </p>

        {analysis && (
          <section className="space-y-4 rounded-3xl border bg-card p-4 shadow-2xs sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                <h2 className="font-display text-lg font-extrabold text-foreground">
                  {t.cropQualityResults}
                </h2>
              </div>
              {analyzedAt && (
                <span className="text-xs text-muted-foreground">
                  {t.cropQualityAnalyzedAt}: {formatAnalyzedAt(analyzedAt)}
                </span>
              )}
            </div>

            {!analysis.imageSufficient && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>{t.cropQualityInsufficient}</strong> {analysis.limitationWarning}
                </span>
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <ResultCard title={t.cropQualityCropIdentification}>
                <p className="font-bold text-foreground">{analysis.cropIdentification.name}</p>
                <p>{analysis.cropIdentification.notes}</p>
              </ResultCard>
              <ResultCard title={t.cropQualityEstimatedGrade}>
                <p className="font-bold text-foreground">
                  {analysis.estimatedGrade}{" "}
                  <span className="text-xs font-normal">· AI estimate</span>
                </p>
                <p>{analysis.gradeRationale}</p>
              </ResultCard>
              <ResultCard title={t.cropQualityConfidence}>
                <p className="font-bold text-foreground">{analysis.confidenceLevel}</p>
                <p>{analysis.confidenceRationale}</p>
              </ResultCard>
              <ResultCard title={t.cropQualityObservations}>
                <ResultList items={analysis.visibleQualityObservations} />
              </ResultCard>
              <ResultCard title={t.cropQualityDefects}>
                {analysis.visibleDefects.length > 0 ? (
                  <ResultList items={analysis.visibleDefects} />
                ) : (
                  <p>{t.cropQualityNoIssuesSeen}</p>
                )}
              </ResultCard>
              <ResultCard title={t.cropQualityNextSteps}>
                <ResultList items={analysis.recommendedNextSteps} />
              </ResultCard>
            </div>

            {analysis.limitationWarning && analysis.imageSufficient && (
              <p className="text-xs text-muted-foreground">
                {t.cropQualityImageWarning}: {analysis.limitationWarning}
              </p>
            )}
          </section>
        )}
      </div>
    </Page>
  );
}

function ResultCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl border bg-background p-3 text-sm text-muted-foreground">
      <h3 className="font-bold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function ResultList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}
