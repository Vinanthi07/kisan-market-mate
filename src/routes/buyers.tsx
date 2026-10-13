import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Handshake,
  Image as ImageIcon,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Search,
  Send,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Star,
  Sprout,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import { rupees } from "@/lib/calc";
import { CROPS, cropById, DEMO_BUYERS, type BuyerListing, type CropId } from "@/lib/data";
import { fmt } from "@/lib/i18n";
import {
  assessProcurementQuality,
  summarizeQualityReviews,
  type QualityReview,
} from "@/lib/quality";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/buyers")({
  head: () => ({
    meta: [
      { title: "Direct Buyer Marketplace | KisanSaathi" },
      {
        name: "description",
        content:
          "Connect directly with bulk agri-produce buyers, FPOs and food processors. Post your harvest and receive direct enquiries.",
      },
    ],
  }),
  component: DirectBuyerMarketplacePage,
});

export interface FarmerProduceListing {
  id: string;
  cropId: CropId;
  cropName: string;
  quantity: number;
  unit: "quintal" | "kg" | "tonne";
  expectedPrice: number;
  harvestDate: string;
  location: string;
  qualityDescription: string;
  preferredContact: "phone" | "whatsapp" | "in_app";
  farmerName: string;
  farmerPhone: string;
  hidePhonePublicly: boolean;
  photoUrl?: string;
  moisturePercent?: number | null;
  visibleDefectPercent?: number | null;
  sampleInspected?: boolean;
  createdAt: string;
  status: "active" | "negotiating" | "sold";
  isDemo: boolean;
}

export interface BuyerEnquiry {
  id: string;
  listingId: string;
  targetName: string;
  enquirerName: string;
  enquirerPhone: string;
  quantityRequested: number;
  message: string;
  timestamp: string;
  status: "sent" | "viewed" | "contacted";
}

const LISTINGS_STORAGE_KEY = "kisansaathi.farmer_listings";
const ENQUIRIES_STORAGE_KEY = "kisansaathi.buyer_enquiries";
const QUALITY_REVIEWS_STORAGE_KEY = "kisansaathi.quality_reviews";

function DirectBuyerMarketplacePage() {
  const { s, t } = useSettings();
  const [activeTab, setActiveTab] = useState<"buyers" | "farmer_listings">("buyers");
  const [filterCrop, setFilterCrop] = useState<CropId | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Post Listing Modal
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [postCrop, setPostCrop] = useState<CropId>(s.crop);
  const [postQty, setPostQty] = useState<number>(20);
  const [postUnit, setPostUnit] = useState<"quintal" | "kg" | "tonne">("quintal");
  const [postPrice, setPostPrice] = useState<number>(2200);
  const [postHarvestDate, setPostHarvestDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [postLocation, setPostLocation] = useState<string>(
    s.loc ? `${s.loc.village || s.loc.district}, ${s.loc.state}` : "Kolar, Karnataka",
  );
  const [postQuality, setPostQuality] = useState<string>("Grade A clean, dry harvest");
  const [postMoisturePercent, setPostMoisturePercent] = useState("");
  const [postVisibleDefectPercent, setPostVisibleDefectPercent] = useState("");
  const [postPreferredContact, setPostPreferredContact] = useState<"phone" | "whatsapp" | "in_app">(
    "phone",
  );
  const [postFarmerName, setPostFarmerName] = useState<string>(s.farmerName || "Farmer");
  const [postPhone, setPostPhone] = useState<string>(s.farmerPhone || "9845012345");
  const [hidePhone, setHidePhone] = useState<boolean>(false);
  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Enquiry Modal
  const [enquiryModalTarget, setEnquiryModalTarget] = useState<{
    id: string;
    name: string;
    cropName: string;
  } | null>(null);
  const [enquirerName, setEnquirerName] = useState<string>("");
  const [enquirerPhone, setEnquirerPhone] = useState<string>("");
  const [enquirerQty, setEnquirerQty] = useState<number>(10);
  const [enquiryMessage, setEnquiryMessage] = useState<string>("");
  const [enquirySuccessMsg, setEnquirySuccessMsg] = useState<string | null>(null);

  // Stored Listings & Enquiries
  const [userListings, setUserListings] = useState<FarmerProduceListing[]>([]);
  const [userEnquiries, setUserEnquiries] = useState<BuyerEnquiry[]>([]);
  const [qualityReviews, setQualityReviews] = useState<QualityReview[]>([]);
  const [qualityListing, setQualityListing] = useState<FarmerProduceListing | null>(null);
  const [qualityMoisture, setQualityMoisture] = useState("");
  const [qualityDefects, setQualityDefects] = useState("");
  const [qualitySampleInspected, setQualitySampleInspected] = useState(false);
  const [reviewListing, setReviewListing] = useState<FarmerProduceListing | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPurchaseReported, setReviewPurchaseReported] = useState(false);
  const [trustMessage, setTrustMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LISTINGS_STORAGE_KEY);
      if (stored) setUserListings(JSON.parse(stored));
      const enq = localStorage.getItem(ENQUIRIES_STORAGE_KEY);
      if (enq) setUserEnquiries(JSON.parse(enq));
      const reviews = localStorage.getItem(QUALITY_REVIEWS_STORAGE_KEY);
      if (reviews) setQualityReviews(JSON.parse(reviews));
    } catch {
      /* ignore */
    }
  }, []);

  // Filter DEMO Buyers
  const filteredBuyers = useMemo(() => {
    return DEMO_BUYERS.filter((b) => {
      const matchCrop = filterCrop === "all" || b.crop === filterCrop;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.cropName.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q);
      return matchCrop && matchSearch;
    });
  }, [filterCrop, searchQuery]);

  // Filter Farmer Listings (Demo + User)
  const filteredListings = useMemo(() => {
    return userListings.filter((l) => {
      const matchCrop = filterCrop === "all" || l.cropId === filterCrop;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        l.cropName.toLowerCase().includes(q) ||
        l.farmerName.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q);
      return matchCrop && matchSearch;
    });
  }, [userListings, filterCrop, searchQuery]);

  // Image Upload handler (safe preview)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError(t.buyerImageTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPostPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Produce Listing
  const handlePostListing = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = postPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setFormError(t.buyerInvalidPhone);
      return;
    }
    if (postQty <= 0) {
      setFormError(t.buyerInvalidQuantity);
      return;
    }
    if (postPrice <= 0) {
      setFormError(t.buyerInvalidPrice);
      return;
    }

    const cr = cropById(postCrop);
    const newListing: FarmerProduceListing = {
      id: "fl-" + Date.now(),
      cropId: postCrop,
      cropName: cr.name,
      quantity: postQty,
      unit: postUnit,
      expectedPrice: postPrice,
      harvestDate: postHarvestDate,
      location: postLocation.trim() || "Local Village",
      qualityDescription: postQuality.trim(),
      moisturePercent: postMoisturePercent === "" ? null : Number(postMoisturePercent),
      visibleDefectPercent: postVisibleDefectPercent === "" ? null : Number(postVisibleDefectPercent),
      sampleInspected: false,
      preferredContact: postPreferredContact,
      farmerName: postFarmerName.trim() || "Farmer Member",
      farmerPhone: cleanPhone,
      hidePhonePublicly: hidePhone,
      photoUrl: postPhotoPreview ?? undefined,
      createdAt: new Date().toLocaleDateString("en-IN"),
      status: "active",
      isDemo: false,
    };

    const updated = [newListing, ...userListings];
    setUserListings(updated);
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(updated));

    setIsPostingModalOpen(false);
    setPostPhotoPreview(null);
    setPostMoisturePercent("");
    setPostVisibleDefectPercent("");
    setActiveTab("farmer_listings");
  };

  // Send Buyer Enquiry
  const handleSendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryModalTarget) return;

    const cleanPhone = enquirerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert(t.buyerInvalidPhone);
      return;
    }

    const newEnquiry: BuyerEnquiry = {
      id: "enq-" + Date.now(),
      listingId: enquiryModalTarget.id,
      targetName: enquiryModalTarget.name,
      enquirerName: enquirerName.trim() || "Buyer",
      enquirerPhone: cleanPhone,
      quantityRequested: enquirerQty,
      message: enquiryMessage.trim() || "Interested in sourcing this produce.",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    const updated = [newEnquiry, ...userEnquiries];
    setUserEnquiries(updated);
    localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(updated));

    setEnquirySuccessMsg(fmt(t.enquirySuccess, { name: enquiryModalTarget.name }));
    setEnquiryModalTarget(null);
    setTimeout(() => setEnquirySuccessMsg(null), 3000);
  };

  const handleDeleteListing = (id: string) => {
    const updated = userListings.filter((l) => l.id !== id);
    setUserListings(updated);
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(updated));
  };

  const activeQualityAssessment = qualityListing
    ? assessProcurementQuality({
        category: cropById(qualityListing.cropId).category,
        moisturePercent: qualityMoisture === "" ? null : Number(qualityMoisture),
        visibleDefectPercent: qualityDefects === "" ? null : Number(qualityDefects),
        sampleInspected: qualitySampleInspected,
      })
    : null;

  const submitQualityReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reviewListing) return;
    if (reviewRating < 1 || reviewRating > 5) {
      setTrustMessage(t.reviewRatingRequired);
      return;
    }
    if (!s.farmerName.trim()) {
      setTrustMessage(t.reviewNameRequired);
      return;
    }
    const review: QualityReview = {
      id: `review-${Date.now()}`,
      listingId: reviewListing.id,
      buyerName: s.farmerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      purchaseReported: reviewPurchaseReported,
      createdAt: new Date().toISOString(),
    };
    const updated = [review, ...qualityReviews];
    setQualityReviews(updated);
    localStorage.setItem(QUALITY_REVIEWS_STORAGE_KEY, JSON.stringify(updated));
    setReviewListing(null);
    setReviewRating(0);
    setReviewComment("");
    setReviewPurchaseReported(false);
    setTrustMessage(t.reviewSavedMessage);
    setTimeout(() => setTrustMessage(null), 3000);
  };

  const continueFromQualityCheck = () => {
    if (!qualityListing || !activeQualityAssessment) return;
    if (activeQualityAssessment.status === "needs_review") {
      setTrustMessage(t.qualityNeedsReview);
      return;
    }
    if (activeQualityAssessment.status === "caution") {
      setTrustMessage(t.qualityCaution);
      return;
    }
    setTrustMessage(null);
    setEnquiryModalTarget({
      id: qualityListing.id,
      name: qualityListing.farmerName,
      cropName: qualityListing.cropName,
    });
    setQualityListing(null);
  };

  return (
    <Page>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Handshake className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.buyers || "Direct Buyer Marketplace"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.buyerIntro}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPostingModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="size-4" />
            <span>{t.postProduceForSale}</span>
          </button>
        </div>

        {/* Transparency Banner (Per Prompt Section 12) */}
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Shield className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>{t.marketplacePrivacyTitle}</span>
          </div>
          <p className="leading-relaxed">
            {t.marketplacePrivacyBody}
          </p>
        </div>

        {enquirySuccessMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{enquirySuccessMsg}</span>
          </div>
        )}
        {trustMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-xs font-semibold text-foreground">
            <Info className="size-4 shrink-0 text-primary" />
            <span>{trustMessage}</span>
          </div>
        )}

        {/* Tabs: Verified Institutional Buyers vs Farmer Produce Listings */}
        <div className="flex border-b text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("buyers")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === "buyers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="size-4" />
            <span>{t.bulkBuyerDemands.replace("{n}", String(DEMO_BUYERS.length))}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("farmer_listings")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === "farmer_listings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sprout className="size-4" />
            <span>{t.farmerProduceListings.replace("{n}", String(userListings.length))}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.buyerSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterCrop}
            onChange={(e) => setFilterCrop(e.target.value as CropId | "all")}
            className="h-10 rounded-xl border bg-background px-3 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary shrink-0 w-full sm:w-auto"
          >
            <option value="all">{t.allCrops}</option>
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* TAB 1: BUYER LEADS */}
        {activeTab === "buyers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBuyers.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CropArt id={b.crop} size={44} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">{b.name}</h3>
                        {b.verifiedFpo && (
                          <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 text-[9px] font-black text-emerald-800 dark:text-emerald-300 uppercase">
                            {t.fpoConnect}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3 text-primary" />
                        {b.location}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase shrink-0">
                    DEMO
                  </span>
                </div>

                <div className="rounded-xl bg-muted/40 p-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{t.offeringPrice}</span>
                    <span className="font-extrabold text-primary text-sm">
                      {rupees(b.pricePerQuintal)} / {t.quintal}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      {t.requirementVolume}
                    </span>
                    <span className="font-bold text-foreground">
                      ~{b.weeklyRequirementQ} {t.quintal} / {t.weekly}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground">{t.qualityLabel}</span>{" "}
                  {b.qualityDescription}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <a
                    href={`tel:${b.phone}`}
                    className="flex-1 flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Phone className="size-3.5" />
                    <span>{t.callBuyer}</span>
                  </a>

                  <a
                    href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex min-h-9 items-center justify-center gap-1.5 rounded-xl border bg-background text-xs font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    <MessageCircle className="size-3.5 text-emerald-600" />
                    <span>{t.whatsapp}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      setEnquiryModalTarget({ id: b.id, name: b.name, cropName: b.cropName })
                    }
                    className="flex min-h-9 items-center justify-center rounded-xl border bg-muted/30 px-3 text-xs font-bold text-foreground hover:bg-muted"
                  >
                    {t.enquire}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: FARMER PRODUCE LISTINGS */}
        {activeTab === "farmer_listings" && (
          <div className="space-y-4">
            {filteredListings.length === 0 ? (
              <div className="rounded-2xl border bg-card p-8 text-center space-y-3">
                <Sprout className="size-8 text-muted-foreground mx-auto" />
                <h3 className="font-bold text-foreground text-sm">{t.noProduceListings}</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t.noProduceListingsBody}
                </p>
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  <Plus className="size-4" />
                  <span>{t.postYourProduce}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredListings.map((l) => (
                  <div key={l.id} className="rounded-2xl border bg-card p-4 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <CropArt id={l.cropId} size={44} />
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{l.cropName}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3 text-primary" />
                            {l.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 capitalize">
                          {l.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(l.id)}
                          className="rounded-lg p-1 text-muted-foreground hover:text-destructive hover:bg-muted"
                          aria-label={t.deleteListing}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          {t.availableQty}
                        </span>
                        <span className="font-bold text-foreground">
                          {l.quantity} {l.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          {t.askingPrice}
                        </span>
                        <span className="font-extrabold text-primary text-sm">
                          {rupees(l.expectedPrice)} / {l.unit}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{t.qualityLabel}</span>{" "}
                      {l.qualityDescription}
                    </p>

                    {(() => {
                      const listingReviews = qualityReviews.filter((review) => review.listingId === l.id);
                      const reviewSummary = summarizeQualityReviews(listingReviews);
                      const quality = assessProcurementQuality({
                        category: cropById(l.cropId).category,
                        moisturePercent: l.moisturePercent ?? null,
                        visibleDefectPercent: l.visibleDefectPercent ?? null,
                        sampleInspected: l.sampleInspected ?? false,
                      });
                      return (
                        <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-foreground">
                              {t.qualityReviewTitle}: {reviewSummary.average === null ? t.noQualityReviews : `★ ${reviewSummary.average} (${reviewSummary.count})`}
                            </span>
                            {reviewSummary.purchaseReports > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {fmt(t.purchaseReports, { count: reviewSummary.purchaseReports })}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {quality.status === "ready" ? t.qualityReady : quality.status === "caution" ? t.qualityCaution : t.qualityNeedsReview}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setQualityListing(l);
                                setQualityMoisture(l.moisturePercent == null ? "" : String(l.moisturePercent));
                                setQualityDefects(l.visibleDefectPercent == null ? "" : String(l.visibleDefectPercent));
                                setQualitySampleInspected(false);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground"
                            >
                              <ShieldCheck className="size-3.5" />
                              {t.inspectQualityEnquire}
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewListing(l)}
                              className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-[11px] font-bold text-foreground"
                            >
                              <Star className="size-3.5" />
                              {t.writeQualityReview}
                            </button>
                          </div>
                          {listingReviews.slice(0, 2).map((review) => (
                            <div key={review.id} className="border-t pt-2 text-[11px]">
                              <span className="font-semibold">★ {review.rating} · {review.buyerName}</span>
                              {review.purchaseReported && <span className="ml-1 text-muted-foreground">· {t.purchaseReportedLabel}</span>}
                              {review.comment && <p className="mt-1 text-muted-foreground">{review.comment}</p>}
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 text-primary" />
                        <span className="font-semibold">{l.farmerName}</span>
                      </div>

                      {l.hidePhonePublicly ? (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Lock className="size-3 text-amber-600" />
                          {t.protectedPhone}
                        </span>
                      ) : (
                        <a
                          href={`tel:${l.farmerPhone}`}
                          className="text-primary font-bold hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <Phone className="size-3" />
                          {l.farmerPhone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Post Produce */}
        {isPostingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border bg-card p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-primary" />
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {t.postDirectBuyerTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handlePostListing} className="space-y-3.5 text-xs">
                {formError && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-destructive/10 p-2 text-destructive font-semibold">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {t.chooseCrop}
                  </label>
                  <CropPicker
                    value={postCrop}
                    onChange={(c) => {
                      setPostCrop(c);
                      setPostPrice(cropById(c).basePrice);
                    }}
                    grid={false}
                    showCategoryFilter={true}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      {t.quantity}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={postQty}
                        onChange={(e) => setPostQty(Number(e.target.value) || 1)}
                        className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                        required
                      />
                      <select
                        value={postUnit}
                        onChange={(e) => setPostUnit(e.target.value as "quintal" | "kg" | "tonne")}
                        className="h-10 rounded-xl border bg-background px-2 font-semibold"
                      >
                        <option value="quintal">{t.quintal}</option>
                        <option value="kg">{t.kg}</option>
                        <option value="tonne">{t.tonne}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      {t.expectedPrice} (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={postPrice}
                      onChange={(e) => setPostPrice(Number(e.target.value) || 1)}
                      className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      {t.harvestAvailability}
                    </label>
                    <input
                      type="date"
                      value={postHarvestDate}
                      onChange={(e) => setPostHarvestDate(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      {t.locationVillage}
                    </label>
                    <input
                      type="text"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {t.qualityDescription}
                  </label>
                  <input
                    type="text"
                    placeholder={t.qualityGradePlaceholder}
                    value={postQuality}
                    onChange={(e) => setPostQuality(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 rounded-xl border bg-muted/20 p-3">
                  <div>
                    <label htmlFor="seller-moisture" className="mb-1 block font-semibold text-muted-foreground">{t.sellerMoistureDisclosure}</label>
                    <input id="seller-moisture" type="number" min={0} max={100} step={0.1} value={postMoisturePercent} onChange={(event) => setPostMoisturePercent(event.target.value)} className="h-10 w-full rounded-xl border bg-background px-3" />
                  </div>
                  <div>
                    <label htmlFor="seller-defects" className="mb-1 block font-semibold text-muted-foreground">{t.sellerDefectsDisclosure}</label>
                    <input id="seller-defects" type="number" min={0} max={100} step={0.1} value={postVisibleDefectPercent} onChange={(event) => setPostVisibleDefectPercent(event.target.value)} className="h-10 w-full rounded-xl border bg-background px-3" />
                  </div>
                  <p className="col-span-2 text-[10px] text-muted-foreground">{t.sellerMeasurementDisclosure}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      {t.farmerNameLabel}
                    </label>
                    <input
                      type="text"
                      value={postFarmerName}
                      onChange={(e) => setPostFarmerName(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      {t.phone10Digits}
                    </label>
                    <input
                      type="tel"
                      value={postPhone}
                      onChange={(e) => setPostPhone(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Privacy Toggle */}
                <label className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2.5 font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hidePhone}
                    onChange={(e) => setHidePhone(e.target.checked)}
                    className="size-4 rounded text-primary"
                  />
                  <span>{t.protectPhoneEnquiry}</span>
                </label>

                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <Check className="size-4" />
                  <span>{t.publishListing}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {qualityListing && activeQualityAssessment && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <section className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border bg-card p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {t.procurementQualityTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {qualityListing.cropName} · {qualityListing.farmerName}
                  </p>
                </div>
                <button type="button" onClick={() => setQualityListing(null)} aria-label={t.closePicker} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                  <X className="size-5" />
                </button>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold">{t.qualityScoreLabel}</span>
                  <span className="font-black">{activeQualityAssessment.score}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-primary transition-all" style={{ width: `${activeQualityAssessment.score}%` }} />
                </div>
                <p className="text-xs font-semibold">
                  {activeQualityAssessment.status === "ready" ? t.qualityReady : activeQualityAssessment.status === "caution" ? t.qualityCaution : t.qualityNeedsReview}
                </p>
              </div>

              {activeQualityAssessment.moistureLimit !== null && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground" htmlFor="quality-moisture">
                    {t.sampleMoisture}
                  </label>
                  <input id="quality-moisture" type="number" min={0} max={100} step={0.1} value={qualityMoisture} onChange={(event) => setQualityMoisture(event.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" />
                  <p className="text-[11px] text-muted-foreground">{fmt(t.moistureGuideline, { limit: activeQualityAssessment.moistureLimit })}</p>
                  <p className="text-[11px] font-medium">{qualityMoisture === "" ? t.qualityMoistureMissing : Number(qualityMoisture) <= activeQualityAssessment.moistureLimit ? t.qualityMoisturePass : t.qualityMoistureFail}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground" htmlFor="quality-defects">
                  {t.sampleDefects}
                </label>
                <input id="quality-defects" type="number" min={0} max={100} step={0.1} value={qualityDefects} onChange={(event) => setQualityDefects(event.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" />
                <p className="text-[11px] text-muted-foreground">{fmt(t.defectGuideline, { limit: activeQualityAssessment.defectLimit })}</p>
                <p className="text-[11px] font-medium">{qualityDefects === "" ? t.qualityDefectsMissing : Number(qualityDefects) <= activeQualityAssessment.defectLimit ? t.qualityDefectsPass : t.qualityDefectsFail}</p>
              </div>

              <label className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3 text-xs font-medium">
                <input type="checkbox" checked={qualitySampleInspected} onChange={(event) => setQualitySampleInspected(event.target.checked)} className="mt-0.5 size-4 rounded text-primary" />
                <span>{qualitySampleInspected ? t.qualitySamplePass : t.inspectSampleConfirm}</span>
              </label>

              <p className="rounded-xl border border-amber-300/70 bg-amber-50/60 p-3 text-[11px] leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                {t.qualityPrototypeDisclaimer}
              </p>

              <button type="button" onClick={continueFromQualityCheck} disabled={activeQualityAssessment.status !== "ready"} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                <ShieldCheck className="size-4" />
                {t.continueAfterQualityCheck}
              </button>
            </section>
          </div>
        )}

        {reviewListing && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <form onSubmit={submitQualityReview} className="w-full max-w-md rounded-3xl border bg-card p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{t.writeQualityReview}</h3>
                  <p className="text-xs text-muted-foreground">{reviewListing.cropName} · {reviewListing.farmerName}</p>
                </div>
                <button type="button" onClick={() => setReviewListing(null)} aria-label={t.closePicker} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
              </div>
              <fieldset>
                <legend className="mb-2 text-xs font-semibold">{t.ratingLabel}</legend>
                <div className="flex gap-1" role="radiogroup" aria-label={t.ratingLabel}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" role="radio" aria-checked={reviewRating === rating} aria-label={`${rating}/5`} onClick={() => setReviewRating(rating)} className={`rounded-lg p-1 ${rating <= reviewRating ? "text-amber-500" : "text-muted-foreground"}`}>
                      <Star className="size-7" fill={rating <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1">
                <label htmlFor="quality-review-comment" className="text-xs font-semibold">{t.reviewCommentLabel}</label>
                <textarea id="quality-review-comment" rows={3} maxLength={500} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder={t.reviewCommentPlaceholder} className="w-full rounded-xl border bg-background p-3 text-sm" />
              </div>
              <label className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3 text-xs">
                <input type="checkbox" checked={reviewPurchaseReported} onChange={(event) => setReviewPurchaseReported(event.target.checked)} className="mt-0.5 size-4 rounded text-primary" />
                <span>{t.purchaseReportedLabel}</span>
              </label>
              <button type="submit" className="min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">{t.submitQualityReview}</button>
            </form>
          </div>
        )}

        {/* Modal: Buyer Enquiry */}
        {enquiryModalTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border bg-card p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {fmt(t.enquiryWith, { name: enquiryModalTarget.name })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t.cropLabel} {enquiryModalTarget.cropName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnquiryModalTarget(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSendEnquiry} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {t.yourName}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.nameExample}
                    value={enquirerName}
                    onChange={(e) => setEnquirerName(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {t.yourMobile}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder={t.mobilePlaceholder}
                    value={enquirerPhone}
                    onChange={(e) => setEnquirerPhone(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {t.quantityOffered}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={enquirerQty}
                    onChange={(e) => setEnquirerQty(Number(e.target.value) || 1)}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    {t.messageNotes}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t.enquiryMessagePlaceholder}
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    className="w-full rounded-xl border bg-background p-2.5"
                  />
                </div>

                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Send className="size-4" />
                  <span>{t.submitEnquiry}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
