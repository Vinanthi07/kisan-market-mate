import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bookmark,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Coins,
  Copy,
  DollarSign,
  FileSpreadsheet,
  FolderOpen,
  Info,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Scale,
  ShieldAlert,
  Sparkles,
  Sprout,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import {
  calculateFarmingProfit,
  convertQuantity,
  rupees,
  type FarmingProfitInput,
  type FarmingProfitResult,
  type WeightUnit,
} from "@/lib/calc";
import { CROPS, cropById, type CropId } from "@/lib/data";
import { fmt } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Farming Profit & Break-even Calculator | KisanSaathi" },
      {
        name: "description",
        content:
          "Comprehensive agricultural cost of cultivation calculator: Gross revenue, break-even selling price, cost per quintal and scenario analysis.",
      },
    ],
  }),
  component: FarmingProfitCalculatorPage,
});

interface SavedScenario {
  id: string;
  name: string;
  date: string;
  cropName: string;
  areaAcres: number;
  netProfit: number;
  input: FarmingProfitInput;
}

const STORAGE_KEY = "kisansaathi.saved_calculations";

function FarmingProfitCalculatorPage() {
  const { s, set, t } = useSettings();
  const [selectedCropId, setSelectedCropId] = useState<CropId>(s.crop);

  // Cultivation & Yield Inputs
  const [cultivatedArea, setCultivatedArea] = useState<number>(2);
  const [areaUnit, setAreaUnit] = useState<"acre" | "hectare" | "guntha">("acre");
  const [expectedYield, setExpectedYield] = useState<number>(100);
  const [yieldUnit, setYieldUnit] = useState<WeightUnit>("quintal");
  const [expectedSellingPrice, setExpectedSellingPrice] = useState<number>(2200);
  const [priceUnit, setPriceUnit] = useState<WeightUnit>("quintal");

  // Production Costs (Cultivation)
  const [seedCost, setSeedCost] = useState<number>(12000);
  const [fertilizerManureCost, setFertilizerManureCost] = useState<number>(18000);
  const [labourCost, setLabourCost] = useState<number>(24000);
  const [irrigationCost, setIrrigationCost] = useState<number>(6000);
  const [machineryEquipmentCost, setMachineryEquipmentCost] = useState<number>(8000);
  const [otherCultivationCost, setOtherCultivationCost] = useState<number>(4000);

  // Selling & Logistics Costs
  const [packagingCost, setPackagingCost] = useState<number>(2000);
  const [transportCost, setTransportCost] = useState<number>(3600);
  const [mandiFees, setMandiFees] = useState<number>(3300);
  const [otherSellingCost, setOtherSellingCost] = useState<number>(1500);

  // Saved scenarios
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioNameInput, setScenarioNameInput] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load saved scenarios from LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedScenarios(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const crop = useMemo(() => cropById(selectedCropId), [selectedCropId]);
  const areaUnitLabel =
    areaUnit === "acre" ? t.areaUnitAcre : areaUnit === "hectare" ? t.areaUnitHectare : t.areaUnitGuntha;
  const priceUnitLabel = priceUnit === "quintal" ? t.quintal : priceUnit === "kg" ? t.kg : t.tonne;

  // Sync defaults when crop changes
  const handleCropChange = (newCropId: CropId) => {
    setSelectedCropId(newCropId);
    const cr = cropById(newCropId);
    setExpectedSellingPrice(cr.basePrice);
    setExpectedYield(cr.yieldQ * cultivatedArea);
    // Typical input cost spread
    const base = cr.inputCost * cultivatedArea;
    setSeedCost(Math.round(base * 0.15));
    setFertilizerManureCost(Math.round(base * 0.25));
    setLabourCost(Math.round(base * 0.35));
    setIrrigationCost(Math.round(base * 0.1));
    setMachineryEquipmentCost(Math.round(base * 0.1));
    setOtherCultivationCost(Math.round(base * 0.05));
  };

  // Build Input Structure
  const calculationInput: FarmingProfitInput = useMemo(() => {
    return {
      cropName: crop.name,
      cultivatedArea,
      areaUnit,
      expectedYield,
      yieldUnit,
      expectedSellingPrice,
      priceUnit,
      seedCost,
      fertilizerManureCost,
      labourCost,
      irrigationCost,
      machineryEquipmentCost,
      otherCultivationCost,
      packagingCost,
      transportCost,
      mandiFees,
      otherSellingCost,
    };
  }, [
    crop,
    cultivatedArea,
    areaUnit,
    expectedYield,
    yieldUnit,
    expectedSellingPrice,
    priceUnit,
    seedCost,
    fertilizerManureCost,
    labourCost,
    irrigationCost,
    machineryEquipmentCost,
    otherCultivationCost,
    packagingCost,
    transportCost,
    mandiFees,
    otherSellingCost,
  ]);

  // Execute Calculation Engine
  const result: FarmingProfitResult = useMemo(() => {
    return calculateFarmingProfit(calculationInput);
  }, [calculationInput]);

  // Sensitivity Scenarios: +10% price, -10% price
  const optimisticResult = useMemo(() => {
    return calculateFarmingProfit({
      ...calculationInput,
      expectedSellingPrice: Math.round(expectedSellingPrice * 1.1),
    });
  }, [calculationInput, expectedSellingPrice]);

  const pessimisticResult = useMemo(() => {
    return calculateFarmingProfit({
      ...calculationInput,
      expectedSellingPrice: Math.round(expectedSellingPrice * 0.9),
    });
  }, [calculationInput, expectedSellingPrice]);

  // Save Scenario to LocalStorage
  const handleSaveScenario = () => {
    const name = scenarioNameInput.trim() || `${crop.name} (${cultivatedArea} ${areaUnit})`;
    const newScenario: SavedScenario = {
      id: "sc-" + Date.now(),
      name,
      date: new Date().toLocaleDateString("en-IN"),
      cropName: crop.name,
      areaAcres: cultivatedArea,
      netProfit: result.netProfitOrLoss,
      input: calculationInput,
    };
    const updated = [newScenario, ...savedScenarios];
    setSavedScenarios(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setScenarioNameInput("");
    setSaveSuccessMsg(fmt(t.scenarioSaved, { name }));
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleLoadScenario = (sc: SavedScenario) => {
    const inp = sc.input;
    setCultivatedArea(inp.cultivatedArea);
    setAreaUnit(inp.areaUnit);
    setExpectedYield(inp.expectedYield);
    setYieldUnit(inp.yieldUnit);
    setExpectedSellingPrice(inp.expectedSellingPrice);
    setPriceUnit(inp.priceUnit);
    setSeedCost(inp.seedCost);
    setFertilizerManureCost(inp.fertilizerManureCost);
    setLabourCost(inp.labourCost);
    setIrrigationCost(inp.irrigationCost);
    setMachineryEquipmentCost(inp.machineryEquipmentCost);
    setOtherCultivationCost(inp.otherCultivationCost);
    setPackagingCost(inp.packagingCost);
    setTransportCost(inp.transportCost);
    setMandiFees(inp.mandiFees);
    setOtherSellingCost(inp.otherSellingCost);
  };

  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter((sc) => sc.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <Page>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.calculator || "Farming Profit Calculator"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.calculatorIntro}
            </p>
          </div>
        </div>

        {/* Crop & Production Scale Inputs */}
        <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t.chooseCrop}
            </label>
            <CropPicker
              value={selectedCropId}
              onChange={handleCropChange}
              grid={false}
              showCategoryFilter={true}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
            {/* Area */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.cultivateLandArea}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={cultivatedArea}
                  onChange={(e) => setCultivatedArea(Math.max(0.1, Number(e.target.value) || 0.1))}
                  className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold text-foreground"
                />
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as "acre" | "hectare" | "guntha")}
                  className="h-10 rounded-xl border bg-background px-2 text-xs font-semibold"
                >
                  <option value="acre">{t.areaUnitAcre}</option>
                  <option value="hectare">{t.areaUnitHectare}</option>
                  <option value="guntha">{t.areaUnitGuntha}</option>
                </select>
              </div>
            </div>

            {/* Expected Yield */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.expectedHarvestYield}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={expectedYield}
                  onChange={(e) => setExpectedYield(Math.max(0, Number(e.target.value) || 0))}
                  className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold text-foreground"
                />
                <select
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value as "quintal" | "kg" | "tonne")}
                  className="h-10 rounded-xl border bg-background px-2 text-xs font-semibold"
                >
                  <option value="quintal">{t.quintal}</option>
                  <option value="kg">{t.kg}</option>
                  <option value="tonne">{t.tonne}</option>
                </select>
              </div>
            </div>

            {/* Expected Selling Price */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t.expectedPrice} (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={expectedSellingPrice}
                  onChange={(e) =>
                    setExpectedSellingPrice(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold text-foreground"
                />
                <span className="text-xs font-bold text-muted-foreground shrink-0">
                  / {priceUnitLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Cost Inputs (Two Columns: Production vs Marketing) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Production Costs */}
          <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
            <h2 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sprout className="size-4 text-primary" />
              1. {t.farmCultivationExpenses}
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.seedSaplingCost}</label>
                <input
                  type="number"
                  value={seedCost}
                  onChange={(e) => setSeedCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.fertilizerCost}:</label>
                <input
                  type="number"
                  value={fertilizerManureCost}
                  onChange={(e) => setFertilizerManureCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.labourCostLabel}</label>
                <input
                  type="number"
                  value={labourCost}
                  onChange={(e) => setLabourCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.irrigationFuelCost}</label>
                <input
                  type="number"
                  value={irrigationCost}
                  onChange={(e) => setIrrigationCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.machineryHireCost}</label>
                <input
                  type="number"
                  value={machineryEquipmentCost}
                  onChange={(e) => setMachineryEquipmentCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.otherFieldInputs}</label>
                <input
                  type="number"
                  value={otherCultivationCost}
                  onChange={(e) => setOtherCultivationCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t font-bold">
                <span>{t.subtotalProduction}</span>
                <span className="text-foreground">{rupees(result.totalProductionCost)}</span>
              </div>
            </div>
          </div>

          {/* 2. Selling & Logistics Costs */}
          <div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
            <h2 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Coins className="size-4 text-primary" />
              2. {t.postHarvestLogistics}
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.packagingBagsCrates}</label>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.freightToMandi}</label>
                <input
                  type="number"
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.apmcFeesHamali}</label>
                <input
                  type="number"
                  value={mandiFees}
                  onChange={(e) => setMandiFees(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground">{t.incidentalSpoilage}</label>
                <input
                  type="number"
                  value={otherSellingCost}
                  onChange={(e) => setOtherSellingCost(Number(e.target.value) || 0)}
                  className="h-8 w-28 rounded-lg border bg-background px-2 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t font-bold">
                <span>{t.subtotalLogistics}</span>
                <span className="text-foreground">{rupees(result.totalSellingLogisticsCost)}</span>
              </div>

              <div className="rounded-xl bg-muted/40 p-2.5 mt-2 flex items-center justify-between font-extrabold text-foreground">
                <span>{t.totalCombinedCosts}</span>
                <span className="text-destructive">{rupees(result.totalCombinedCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Result Summary Hero Card */}
        <section
          className={`rounded-3xl border-2 p-5 sm:p-6 shadow-sm space-y-4 ${
            result.isProfitable
              ? "border-emerald-500 bg-gradient-to-br from-emerald-500/10 via-card to-card"
              : "border-destructive/80 bg-gradient-to-br from-destructive/10 via-card to-card"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  result.isProfitable
                    ? "bg-emerald-600 text-white"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {result.isProfitable
                  ? t.estimatedProfitable
                  : t.projectedLoss}
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                {result.isProfitable
                  ? `+${rupees(result.netProfitOrLoss)}`
                  : rupees(result.netProfitOrLoss)}
              </h2>
              <p className="text-xs text-muted-foreground">
                {fmt(t.estimatedNetIncome, {
                  area: cultivatedArea,
                  unit: areaUnitLabel,
                  crop: crop.localizedNames[s.lang] ?? crop.name,
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="rounded-2xl border bg-card p-3">
                <span className="block text-[10px] text-muted-foreground font-semibold">
                  {t.grossRevenue}
                </span>
                <span className="font-display text-lg font-extrabold text-foreground">
                  {rupees(result.grossRevenue)}
                </span>
              </div>

              <div className="rounded-2xl border bg-card p-3">
                <span className="block text-[10px] text-muted-foreground font-semibold">
                  {t.profitMargin}
                </span>
                <span className="font-display text-lg font-extrabold text-foreground">
                  {result.profitMarginPercent !== null ? `${result.profitMarginPercent}%` : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Unit Economics: Cost per Unit & Break-Even Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
            <div className="rounded-2xl bg-muted/30 p-3.5 space-y-1">
              <span className="text-xs font-bold text-muted-foreground block">
                {t.productionCostPerQuintal}
              </span>
              <p className="font-display text-xl font-extrabold text-foreground">
                ₹{result.costPerUnitQuintal} / {t.quintal}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {fmt(t.yieldCostExplanation, { yield: result.totalYieldQuintals })}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/30 p-3.5 space-y-1">
              <span className="text-xs font-bold text-muted-foreground block">
                {t.breakEvenPrice}
              </span>
              <p className="font-display text-xl font-extrabold text-primary">
                ₹{result.breakEvenSellingPricePerQuintal} / {t.quintal}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t.breakEvenExplanation}
              </p>
            </div>
          </div>
        </section>

        {/* Sensitivity & Scenario Simulator */}
        <section className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-foreground">
            <Sparkles className="size-4 text-primary" />
            {t.marketSensitivity}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* -10% Price */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1">
                <TrendingDown className="size-3.5" />
                {t.priceDrops10} (₹{Math.round(expectedSellingPrice * 0.9)}/q)
              </span>
              <span className="block text-sm font-extrabold text-foreground">
                {t.netLabel}{" "}
                {pessimisticResult.netProfitOrLoss >= 0
                  ? `+${rupees(pessimisticResult.netProfitOrLoss)}`
                  : rupees(pessimisticResult.netProfitOrLoss)}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {t.marginLabel} {pessimisticResult.profitMarginPercent}%
              </span>
            </div>

            {/* Expected Base Case */}
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-1">
              <span className="font-bold text-primary">
                {t.baseExpected} (₹{expectedSellingPrice}/q)
              </span>
              <span className="block text-sm font-extrabold text-foreground">
                {t.netLabel}{" "}
                {result.netProfitOrLoss >= 0
                  ? `+${rupees(result.netProfitOrLoss)}`
                  : rupees(result.netProfitOrLoss)}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {t.marginLabel} {result.profitMarginPercent}%
              </span>
            </div>

            {/* +10% Price */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="size-3.5" />
                {t.priceRises10} (₹{Math.round(expectedSellingPrice * 1.1)}/q)
              </span>
              <span className="block text-sm font-extrabold text-foreground">
                {t.netLabel} +{rupees(optimisticResult.netProfitOrLoss)}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {t.marginLabel} {optimisticResult.profitMarginPercent}%
              </span>
            </div>
          </div>
        </section>

        {/* Save Scenario & Saved History */}
        <section className="rounded-2xl border bg-card p-4 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Bookmark className="size-4 text-primary" />
              {t.saveCalculation}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.scenarioNamePlaceholder}
              value={scenarioNameInput}
              onChange={(e) => setScenarioNameInput(e.target.value)}
              className="h-10 w-full rounded-xl border bg-background px-3 text-xs focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleSaveScenario}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shrink-0 shadow-xs hover:bg-primary/90"
            >
              <Save className="size-3.5" />
              {t.save}
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-100 p-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Saved Scenarios List */}
          {savedScenarios.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                {fmt(t.savedCalculations, { n: savedScenarios.length })}
              </span>
              <div className="space-y-2">
                {savedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between rounded-xl border bg-muted/20 p-2.5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{sc.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {sc.cropName} · {sc.date} · {t.netLabel} {rupees(sc.netProfit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLoadScenario(sc)}
                        className="rounded-lg border bg-card px-2.5 py-1 text-xs font-semibold text-primary hover:bg-muted"
                      >
                        {t.loadScenario}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(sc.id)}
                        className="rounded-lg border bg-card p-1 text-destructive hover:bg-muted"
                        aria-label={t.deleteScenario}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldAlert className="size-4 text-primary" />
            <span>{t.economicNotice}</span>
          </div>
          <p className="leading-relaxed">
            {t.disclaimer}
          </p>
        </div>
      </div>
    </Page>
  );
}
