import { describe, expect, it } from "vitest";
import {
  calculateFarmingProfit,
  calculateNetProceeds,
  convertPrice,
  convertQuantity,
  evaluateWhenToSell,
  rankMarketsByNetProceeds,
} from "@/lib/calc";
import {
  buildHistoricalPriceSeries,
  cropById,
  CROPS,
  getMandiPriceRecords,
  getPriceHistoryWindow,
  MARKETS,
} from "@/lib/data";
import { DICTS, LANGS } from "@/lib/i18n";
import { assessProcurementQuality, summarizeQualityReviews } from "@/lib/quality";

describe("KisanSaathi Core Formula & Calculation Engine", () => {
  it("computes the master specification example: 100 kg @ ₹30/kg, transport ₹400, other ₹100 => ₹2,500", () => {
    // Exactly matches prompt Section 8:
    // A farmer sells 100 kg at ₹30/kg. Transport costs ₹400 and other costs total ₹100.
    // Gross revenue = ₹3,000.
    // Net proceeds = ₹3,000 − ₹400 − ₹100 = ₹2,500.
    const result = calculateNetProceeds({
      pricePerUnit: 30,
      quantity: 100,
      unit: "kg",
      transportCost: 400,
      otherSellingExpenses: 100,
    });

    expect(result.grossRevenue).toBe(3000);
    expect(result.totalCosts).toBe(500);
    expect(result.netProceeds).toBe(2500);
    expect(result.netProceedsPerUnit).toBe(25);
  });

  it("handles full cost component itemization: transport, statutory fees, loading, packaging and spoilage", () => {
    const result = calculateNetProceeds({
      pricePerUnit: 2500, // ₹2,500 / quintal
      quantity: 20, // 20 quintals
      unit: "quintal",
      transportCost: 1500,
      marketFees: 750,
      loadingUnloadingCharges: 300,
      packagingCosts: 400,
      otherSellingExpenses: 250,
    });

    expect(result.grossRevenue).toBe(50000);
    expect(result.totalCosts).toBe(3200);
    expect(result.netProceeds).toBe(46800);
    expect(result.netProceedsPerUnit).toBe(2340);
  });

  it("rejects negative inputs with descriptive validation errors", () => {
    expect(() =>
      calculateNetProceeds({
        pricePerUnit: 30,
        quantity: -10,
      }),
    ).toThrow("Quantity cannot be negative");

    expect(() =>
      calculateNetProceeds({
        pricePerUnit: -100,
        quantity: 10,
      }),
    ).toThrow("Price per unit cannot be negative");

    expect(() =>
      calculateNetProceeds({
        pricePerUnit: 100,
        quantity: 10,
        transportCost: -50,
      }),
    ).toThrow("Cost components cannot be negative");
  });

  it("keeps the Kannada locale strings active for the dashboard and settings labels", () => {
    expect(DICTS.kn.appName).toContain("ಕಿಸಾನ್");
    expect(DICTS.kn.selectLanguage).toContain("ಭಾಷೆ");
    expect(DICTS.kn.topRecommendedMarket).toContain("ಮಾರುಕಟ್ಟೆ");
    expect(DICTS.kn.compareAllMandis).toContain("ಮಂಡಿ");
    expect(DICTS.kn.exploreEcoGuard).toContain("ಎಕೋ");
  });

  describe("Unit Conversions", () => {
    it("converts weight quantities between kg, quintal, and tonne", () => {
      // 100 kg = 1 quintal
      expect(convertQuantity(100, "kg", "quintal")).toBe(1);
      // 10 quintals = 1 tonne = 1000 kg
      expect(convertQuantity(10, "quintal", "tonne")).toBe(1);
      expect(convertQuantity(1, "tonne", "kg")).toBe(1000);
      expect(convertQuantity(250, "kg", "tonne")).toBe(0.25);
    });

    it("converts prices per unit accurately", () => {
      // ₹30/kg = ₹3000/quintal = ₹30,000/tonne
      expect(convertPrice(30, "kg", "quintal")).toBe(3000);
      expect(convertPrice(30, "kg", "tonne")).toBe(30000);
      expect(convertPrice(2500, "quintal", "kg")).toBe(25);
    });
  });

  describe("Multi-Market Ranking Engine", () => {
    it("ranks candidate markets by net proceeds, identifies the best choice, and computes relative spread", () => {
      const crop = cropById("onion");
      const ranked = rankMarketsByNetProceeds({
        crop,
        quantity: 10,
        unit: "quintal",
        originCoords: [13.14, 78.13], // Kolar
        ratePerKmPerQuintal: 1.8,
        maxKm: 300,
      });

      expect(ranked.length).toBeGreaterThan(0);

      // Verify markets are sorted descending by net proceeds
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].breakdown.netProceeds).toBeGreaterThanOrEqual(
          ranked[i + 1].breakdown.netProceeds,
        );
      }

      // First market is best
      expect(ranked[0].isBest).toBe(true);
      expect(ranked[0].breakdown.netProceeds).toBeGreaterThan(0);
    });

    it("honors manual transporter quotes when provided", () => {
      const crop = cropById("tomato");
      const ranked = rankMarketsByNetProceeds({
        crop,
        quantity: 10,
        unit: "quintal",
        originCoords: [13.14, 78.13],
        ratePerKmPerQuintal: 1.8,
        manualTransportQuotes: {
          klr: 300, // cheap local quote
        },
      });

      const kolarMarket = ranked.find((r) => r.market.id === "klr");
      expect(kolarMarket).toBeDefined();
      expect(kolarMarket?.transportCost).toBe(300);
    });
  });

  describe("When to Sell Decision Engine", () => {
    it("handles insufficient historical data gracefully (< 3 observations)", () => {
      const crop = cropById("paddy");
      const advisory = evaluateWhenToSell([2200], crop, 10);
      expect(advisory.direction).toBe("insufficient_data");
      expect(advisory.directionLabel).toContain("insufficient data");
      expect(advisory.average3Day).toBeNull();
    });

    it("computes 3-day and 7-day averages when sufficient observations exist", () => {
      const crop = cropById("paddy");
      const series = [2000, 2050, 2100, 2150, 2200, 2250, 2300];
      const advisory = evaluateWhenToSell(series, crop, 10);

      expect(advisory.average3Day).toBe(Math.round((2200 + 2250 + 2300) / 3));
      expect(advisory.average7Day).toBe(Math.round(series.reduce((a, b) => a + b) / 7));
      expect(advisory.direction).toBe("increasing");
    });

    it("enforces prompt sale for perishable crops (e.g. Tomato) regardless of price momentum", () => {
      const tomato = cropById("tomato");
      expect(tomato.perishability).toBe("high");

      const risingPrices = [1200, 1300, 1400, 1500, 1600, 1700, 1800];
      const advisory = evaluateWhenToSell(risingPrices, tomato, 10);

      // Must advise selling promptly because high perishability precludes holding
      expect(advisory.recommendation).toBe("sell_now");
      expect(advisory.perishabilityWarning).toBeDefined();
      expect(advisory.perishabilityWarning).toContain("High perishability");
    });
  });

  describe("Farming Profit & Break-Even Calculator", () => {
    it("calculates gross revenue, total combined costs, net profit and break-even selling price", () => {
      const result = calculateFarmingProfit({
        cropName: "Tomato",
        cultivatedArea: 1,
        areaUnit: "acre",
        expectedYield: 100,
        yieldUnit: "quintal",
        expectedSellingPrice: 1500,
        priceUnit: "quintal",
        seedCost: 15000,
        fertilizerManureCost: 20000,
        labourCost: 25000,
        irrigationCost: 5000,
        machineryEquipmentCost: 5000,
        otherCultivationCost: 2000,
        packagingCost: 2000,
        transportCost: 3000,
        mandiFees: 2250,
        otherSellingCost: 1000,
      });

      expect(result.grossRevenue).toBe(150000);
      expect(result.totalProductionCost).toBe(72000);
      expect(result.totalSellingLogisticsCost).toBe(8250);
      expect(result.totalCombinedCost).toBe(80250);
      expect(result.netProfitOrLoss).toBe(69750);
      expect(result.isProfitable).toBe(true);
      // Cost per quintal = 80250 / 100 = 802.5
      expect(result.costPerUnitQuintal).toBe(802.5);
      expect(result.breakEvenSellingPricePerQuintal).toBe(802.5);
    });

    it("handles zero yield and zero revenue without division by zero errors", () => {
      const result = calculateFarmingProfit({
        cropName: "Failed Crop",
        cultivatedArea: 1,
        areaUnit: "acre",
        expectedYield: 0,
        yieldUnit: "quintal",
        expectedSellingPrice: 2000,
        priceUnit: "quintal",
        seedCost: 10000,
        fertilizerManureCost: 10000,
        labourCost: 5000,
        irrigationCost: 0,
        machineryEquipmentCost: 0,
        otherCultivationCost: 0,
        packagingCost: 0,
        transportCost: 0,
        mandiFees: 0,
        otherSellingCost: 0,
      });

      expect(result.grossRevenue).toBe(0);
      expect(result.netProfitOrLoss).toBe(-25000);
      expect(result.profitMarginPercent).toBeNull();
      expect(result.costPerUnitQuintal).toBe(0);
      expect(result.breakEvenSellingPricePerQuintal).toBe(0);
      expect(result.isProfitable).toBe(false);
    });
  });

  describe("Multilingual Internationalization (i18n)", () => {
    it("supports all 6 specified Indian languages with complete dictionaries", () => {
      const expectedCodes = ["en", "hi", "kn", "ta", "te", "mr"];
      expect(LANGS.map((l) => l.code)).toEqual(expect.arrayContaining(expectedCodes));

      expectedCodes.forEach((code) => {
        const dict = DICTS[code as keyof typeof DICTS];
        expect(dict).toBeDefined();
        expect(dict.appName).toBeDefined();
        expect(dict.mandiPrices).toBeDefined();
        expect(dict.bestMarket).toBeDefined();
        expect(dict.calculator).toBeDefined();
        expect(dict.lantanaGuard).toBeDefined();
        expect(dict.lantanaWarning).toBeDefined();
      });
    });
  });

  it("translates dashboard, settings and market-finder copy in every non-English locale", () => {
    const visibleKeys = [
      "heroDescription",
      "topRecommendedMarket",
      "coreToolsServices",
      "searchMinMaxModal",
      "rankNetProceedsDesc",
      "priceTrajectoryDesc",
      "profileIntro",
      "profileSaved",
      "manualLocationHint",
      "saveProfileSettings",
      "showMandiMap",
      "hideInteractiveMap",
      "highestEstimatedNet",
      "approxPriceForUnit",
      "costBreakdown",
      "sellPromptlyAction",
      "sellPromptlyReason",
      "advisoryMethodologyBody",
      "calculatorIntro",
      "marketSensitivity",
      "trendIntro",
      "cropPlanningWorksheet",
      "workshopIntro",
      "topicMandiAwareness",
      "transportPlanTitle",
      "transportRequestSaved",
      "buyerIntro",
      "marketplacePrivacyBody",
      "postDirectBuyerTitle",
      "fertilizerIntro",
      "productQualityNoticeBody",
      "lantanaModuleBadge",
      "foodSafetyWarningTitle",
      "lantanaToxicityWarning",
      "lantanaStorageTitle",
    ] as const;

    for (const { code } of LANGS) {
      if (code === "en") continue;
      for (const key of visibleKeys) {
        expect(DICTS[code][key], `${code}.${key} should be translated`).not.toBe(DICTS.en[key]);
      }
    }
  });

  describe("Buyer trust and quality screening", () => {
    it("requires sample checks before marking a procurement lot ready", () => {
      const assessment = assessProcurementQuality({
        category: "cereals_millets",
        moisturePercent: null,
        visibleDefectPercent: null,
        sampleInspected: false,
      });

      expect(assessment.status).toBe("needs_review");
      expect(assessment.score).toBe(25);
      expect(assessment.moistureLimit).toBe(14);
    });

    it("flags measurements exceeding category screening guidelines", () => {
      const assessment = assessProcurementQuality({
        category: "cereals_millets",
        moisturePercent: 16,
        visibleDefectPercent: 4,
        sampleInspected: true,
      });

      expect(assessment.status).toBe("caution");
      expect(assessment.checks.find((check) => check.id === "moisture")?.passed).toBe(false);
      expect(assessment.score).toBe(65);
    });

    it("marks a measured, inspected lot ready when checks pass", () => {
      const assessment = assessProcurementQuality({
        category: "pulses",
        moisturePercent: 10,
        visibleDefectPercent: 2,
        sampleInspected: true,
      });

      expect(assessment.status).toBe("ready");
      expect(assessment.score).toBe(100);
      expect(assessment.moistureLimit).toBe(12);
    });

    it("summarizes buyer ratings and keeps purchase reports explicitly separate", () => {
      const summary = summarizeQualityReviews([
        { id: "1", listingId: "lot", buyerName: "Buyer A", rating: 5, comment: "Good", purchaseReported: true, createdAt: "2026-01-01" },
        { id: "2", listingId: "lot", buyerName: "Buyer B", rating: 3, comment: "Mixed", purchaseReported: false, createdAt: "2026-01-02" },
      ]);

      expect(summary).toEqual({ average: 4, count: 2, purchaseReports: 1 });
      expect(summarizeQualityReviews([])).toEqual({ average: null, count: 0, purchaseReports: 0 });
    });

    it("provides quality feature labels in every supported language", () => {
      for (const { code } of LANGS) {
        if (code === "en") continue;
        const dict = DICTS[code];
        expect(dict.procurementQualityTitle, `${code} quality title`).toBeTruthy();
        expect(dict.qualityPrototypeDisclaimer, `${code} transparency disclaimer`).not.toBe(
          DICTS.en.qualityPrototypeDisclaimer,
        );
        expect(dict.qualityReviewTitle, `${code} review title`).toBeTruthy();
      }
    });
  });

  it("returns demo mandi prices while live API credentials are unavailable", () => {
    const records = getMandiPriceRecords("tomato");
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) => record.isDemo)).toBe(true);
  });

  it("builds a one-year historical window and recent 7-day history for selected crops and markets", () => {
    const crop = cropById("tomato");
    const market = MARKETS.find((item) => item.kind === "mandi")!;
    const window = getPriceHistoryWindow(new Date("2026-10-13T00:00:00Z"));
    const history = buildHistoricalPriceSeries(crop, market, new Date("2026-10-13T00:00:00Z"));

    expect(history.length).toBeGreaterThanOrEqual(365);
    expect(history[0].date).toBe(window.startDate);
    expect(history[history.length - 1].date).toBe(window.endDate);
    expect(history.filter((point) => point.isRecentSevenDay).length).toBeLessThanOrEqual(7);
  });
});
