import type { CropCategory } from "./data";

export interface ProcurementQualityInput {
  category: CropCategory;
  moisturePercent: number | null;
  visibleDefectPercent: number | null;
  sampleInspected: boolean;
}

export interface ProcurementQualityCheck {
  id: "moisture" | "defects" | "sample";
  passed: boolean;
  required: boolean;
  limit?: number;
}

export interface ProcurementQualityAssessment {
  score: number;
  status: "ready" | "caution" | "needs_review";
  checks: ProcurementQualityCheck[];
  moistureLimit: number | null;
  defectLimit: number;
}

export const moistureLimitForCategory = (category: CropCategory): number | null => {
  switch (category) {
    case "cereals_millets":
      return 14;
    case "pulses":
      return 12;
    case "oilseeds":
      return 8;
    default:
      return null;
  }
};

/**
 * A transparent checklist score for the prototype procurement flow.
 * This is deterministic rules-based screening, not image recognition or certification.
 */
export function assessProcurementQuality({
  category,
  moisturePercent,
  visibleDefectPercent,
  sampleInspected,
}: ProcurementQualityInput): ProcurementQualityAssessment {
  const moistureLimit = moistureLimitForCategory(category);
  const defectLimit = 10;
  const checks: ProcurementQualityCheck[] = [];

  if (moistureLimit !== null) {
    checks.push({
      id: "moisture",
      passed: moisturePercent !== null && moisturePercent <= moistureLimit,
      required: moisturePercent !== null,
      limit: moistureLimit,
    });
  }
  checks.push({
    id: "defects",
    passed: visibleDefectPercent !== null && visibleDefectPercent <= defectLimit,
    required: visibleDefectPercent !== null,
    limit: defectLimit,
  });
  checks.push({ id: "sample", passed: sampleInspected, required: sampleInspected });

  let score = 100;
  if (moistureLimit !== null) {
    if (moisturePercent === null) score -= 25;
    else if (moisturePercent > moistureLimit) score -= 35;
  }
  if (visibleDefectPercent === null) score -= 25;
  else if (visibleDefectPercent > defectLimit) score -= 35;
  if (!sampleInspected) score -= 25;

  const missingData = (moistureLimit !== null && moisturePercent === null) ||
    visibleDefectPercent === null || !sampleInspected;
  const failedMeasurement = (moistureLimit !== null && moisturePercent !== null && moisturePercent > moistureLimit) ||
    (visibleDefectPercent !== null && visibleDefectPercent > defectLimit);

  return {
    score: Math.max(0, score),
    status: missingData ? "needs_review" : failedMeasurement ? "caution" : "ready",
    checks,
    moistureLimit,
    defectLimit,
  };
}

export interface QualityReview {
  id: string;
  listingId: string;
  buyerName: string;
  rating: number;
  comment: string;
  purchaseReported: boolean;
  createdAt: string;
}

export function summarizeQualityReviews(reviews: QualityReview[]) {
  if (reviews.length === 0) return { average: null, count: 0, purchaseReports: 0 };
  return {
    average: Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10,
    count: reviews.length,
    purchaseReports: reviews.filter((review) => review.purchaseReported).length,
  };
}
