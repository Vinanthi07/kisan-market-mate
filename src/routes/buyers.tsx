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
  ShieldAlert,
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LISTINGS_STORAGE_KEY);
      if (stored) setUserListings(JSON.parse(stored));
      const enq = localStorage.getItem(ENQUIRIES_STORAGE_KEY);
      if (enq) setUserEnquiries(JSON.parse(enq));
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
      setFormError("Image file size must be less than 2MB.");
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
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (postQty <= 0) {
      setFormError("Quantity must be greater than zero.");
      return;
    }
    if (postPrice <= 0) {
      setFormError("Expected price must be greater than zero.");
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
    setActiveTab("farmer_listings");
  };

  // Send Buyer Enquiry
  const handleSendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryModalTarget) return;

    const cleanPhone = enquirerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
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

    setEnquirySuccessMsg(`Enquiry submitted successfully to ${enquiryModalTarget.name}.`);
    setEnquiryModalTarget(null);
    setTimeout(() => setEnquirySuccessMsg(null), 3000);
  };

  const handleDeleteListing = (id: string) => {
    const updated = userListings.filter((l) => l.id !== id);
    setUserListings(updated);
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(updated));
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
              Connect directly with FPOs, retail aggregators and verified institutional purchasers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPostingModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="size-4" />
            <span>Post Produce for Sale</span>
          </button>
        </div>

        {/* Transparency Banner (Per Prompt Section 12) */}
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Shield className="size-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Marketplace Transparency & Privacy Safeguards</span>
          </div>
          <p className="leading-relaxed">
            All prospective buyer requirements below are pre-seeded <strong>DEMO records</strong> to
            demonstrate interface functionality. Genuine farmer listings are stored locally on your
            device. KisanSaathi does not process financial escrow or guarantee payments. Always
            verify buyer credentials and agree on cash/bank terms prior to loading vehicles.
          </p>
        </div>

        {enquirySuccessMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{enquirySuccessMsg}</span>
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
            <span>Bulk Buyer Demands (DEMO) ({DEMO_BUYERS.length})</span>
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
            <span>Farmer Produce Listings ({userListings.length})</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by buyer name, crop, or district..."
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
            <option value="all">All Crops</option>
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
                            FPO Partner
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
                    <span className="text-[10px] text-muted-foreground block">Offering Price</span>
                    <span className="font-extrabold text-primary text-sm">
                      {rupees(b.pricePerQuintal)} / quintal
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Requirement Volume
                    </span>
                    <span className="font-bold text-foreground">
                      ~{b.weeklyRequirementQ} quintals / week
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground">Quality:</span>{" "}
                  {b.qualityDescription}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <a
                    href={`tel:${b.phone}`}
                    className="flex-1 flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Phone className="size-3.5" />
                    <span>Call Buyer</span>
                  </a>

                  <a
                    href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex min-h-9 items-center justify-center gap-1.5 rounded-xl border bg-background text-xs font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    <MessageCircle className="size-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      setEnquiryModalTarget({ id: b.id, name: b.name, cropName: b.cropName })
                    }
                    className="flex min-h-9 items-center justify-center rounded-xl border bg-muted/30 px-3 text-xs font-bold text-foreground hover:bg-muted"
                  >
                    Enquire
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
                <h3 className="font-bold text-foreground text-sm">No produce listings yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Be the first to list your harvested grains, vegetables or fruits directly for bulk
                  buyers.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  <Plus className="size-4" />
                  <span>Post Your Produce</span>
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
                          aria-label="Delete listing"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Available Qty
                        </span>
                        <span className="font-bold text-foreground">
                          {l.quantity} {l.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Asking Price
                        </span>
                        <span className="font-extrabold text-primary text-sm">
                          {rupees(l.expectedPrice)} / {l.unit}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Quality:</span>{" "}
                      {l.qualityDescription}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 text-primary" />
                        <span className="font-semibold">{l.farmerName}</span>
                      </div>

                      {l.hidePhonePublicly ? (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Lock className="size-3 text-amber-600" />
                          Phone protected (In-app enquiry)
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
                    Post Produce for Direct Buyers
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
                    Select Crop
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
                      Quantity
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
                        <option value="quintal">q</option>
                        <option value="kg">kg</option>
                        <option value="tonne">tonne</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Expected Price (₹)
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
                      Harvest Availability Date
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
                      Location / Village
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
                    Quality & Grade Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Medium size, dry skin, sorted in plastic crates"
                    value={postQuality}
                    onChange={(e) => setPostQuality(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Farmer / Contact Name
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
                      Phone Number (10 Digits)
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
                  <span>Protect phone number (Buyers must submit an enquiry first)</span>
                </label>

                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <Check className="size-4" />
                  <span>Publish Produce Listing</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Buyer Enquiry */}
        {enquiryModalTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border bg-card p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Enquire with {enquiryModalTarget.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Crop: {enquiryModalTarget.cropName}
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
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={enquirerName}
                    onChange={(e) => setEnquirerName(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Your Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={enquirerPhone}
                    onChange={(e) => setEnquirerPhone(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Quantity Offered (Quintals)
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
                    Message / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Produce ready date, expected rate, or sample availability..."
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
                  <span>Submit Direct Enquiry</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
