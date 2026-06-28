/**
 * DROPi Auto-Moderation Engine — Sprint B
 * 
 * Validates products against marketplace rules before they enter the review queue.
 * Returns a list of violations (if any). Products with violations are auto-rejected
 * with a detailed reason. Products from trusted merchants (trustScore ≥ 80) with
 * no violations are auto-approved.
 * 
 * Rules enforced (from canonical documents):
 * 1. Prohibited keywords in name/description
 * 2. Price limits (min/max per category)
 * 3. Mandatory field validation (weight, dimensions for drone eligibility)
 * 4. Image requirements (at least 1 image for review submission)
 * 5. Description quality (minimum length for review)
 * 6. Weight/dimension sanity checks
 * 7. Category-specific restrictions
 */

// ===== PROHIBITED KEYWORDS =====
// Items that cannot be sold on DROPi marketplace (canonical: Anexa 6B §4.2)
const PROHIBITED_KEYWORDS = [
  // Weapons & ammunition
  "arma", "arme", "pistol", "pusca", "munitie", "glont", "grenada", "explosiv",
  "weapon", "gun", "firearm", "ammunition", "explosive", "grenade",
  // Drugs & narcotics
  "drog", "droguri", "narcotic", "cannabis", "marijuana", "cocaina", "heroina",
  "drug", "narcotic", "cocaine", "heroin", "meth", "amphetamine",
  // Counterfeit
  "contrafacut", "replica", "fake", "counterfeit", "knockoff",
  // Hazardous materials
  "radioactiv", "toxic", "otrava", "cianura", "acid sulfuric",
  "radioactive", "poison", "cyanide", "sulfuric acid",
  // Human trafficking / organs
  "organ", "organe umane", "sclav", "trafic",
  // Stolen goods
  "furat", "stolen",
];

// ===== PRICE LIMITS PER CATEGORY =====
// Minimum and maximum prices in RON (canonical: marketplace financial flow)
const PRICE_LIMITS: Record<string, { min: number; max: number }> = {
  "Food & Groceries": { min: 1, max: 5000 },
  "Electronics": { min: 5, max: 50000 },
  "Clothing & Fashion": { min: 5, max: 20000 },
  "Health & Beauty": { min: 2, max: 10000 },
  "Home & Garden": { min: 5, max: 100000 },
  "Sports & Outdoors": { min: 5, max: 50000 },
  "Books & Stationery": { min: 1, max: 5000 },
  "Toys & Games": { min: 3, max: 10000 },
  "Automotive": { min: 10, max: 200000 },
  "Pet Supplies": { min: 2, max: 10000 },
  "Other": { min: 1, max: 50000 },
};

// Default limits for unknown categories
const DEFAULT_PRICE_LIMITS = { min: 1, max: 100000 };

// ===== WEIGHT LIMITS =====
const MAX_WEIGHT_GRAMS = 50000; // 50kg max for any delivery
const MIN_WEIGHT_GRAMS = 1; // At least 1 gram

// ===== DIMENSION LIMITS =====
const MAX_DIMENSION_CM = 200; // 2m max per side
const MIN_DIMENSION_CM = 0.1; // At least 0.1cm

// ===== MODERATION RESULT =====
export interface ModerationViolation {
  rule: string;
  severity: "critical" | "warning" | "info";
  message: string;
  field?: string;
}

export interface ModerationResult {
  passed: boolean;
  violations: ModerationViolation[];
  autoAction: "approve" | "reject" | "review"; // What the engine recommends
  reason: string; // Human-readable summary
}

// ===== PRODUCT DATA FOR MODERATION =====
export interface ProductForModeration {
  name: string;
  description?: string | null;
  price: number; // parsed from decimal
  currency: string;
  category: string;
  weight: number; // grams
  dimensions?: { l: number; w: number; h: number } | null;
  images?: string[] | null;
  isFragile: boolean;
  requiresSpecialPackaging: boolean;
  stock?: number | null;
}

// ===== STORE CONTEXT =====
export interface StoreContext {
  trustScore: number;
  totalOrders: number;
  previousRejections: number; // count of rejected products
}

// ===== MAIN MODERATION FUNCTION =====
export function moderateProduct(
  product: ProductForModeration,
  storeContext: StoreContext
): ModerationResult {
  const violations: ModerationViolation[] = [];

  // Rule 1: Prohibited keywords
  const textToCheck = `${product.name} ${product.description || ""}`.toLowerCase();
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      violations.push({
        rule: "PROHIBITED_CONTENT",
        severity: "critical",
        message: `Product contains prohibited keyword: "${keyword}". Items in this category cannot be sold on DROPi.`,
        field: "name/description",
      });
      break; // One critical violation is enough
    }
  }

  // Rule 2: Price limits
  const limits = PRICE_LIMITS[product.category] || DEFAULT_PRICE_LIMITS;
  if (product.price < limits.min) {
    violations.push({
      rule: "PRICE_TOO_LOW",
      severity: "warning",
      message: `Price ${product.price} ${product.currency} is below minimum (${limits.min} ${product.currency}) for category "${product.category}".`,
      field: "price",
    });
  }
  if (product.price > limits.max) {
    violations.push({
      rule: "PRICE_TOO_HIGH",
      severity: "warning",
      message: `Price ${product.price} ${product.currency} exceeds maximum (${limits.max} ${product.currency}) for category "${product.category}". High-value items require manual review.`,
      field: "price",
    });
  }

  // Rule 3: Weight sanity
  if (product.weight < MIN_WEIGHT_GRAMS) {
    violations.push({
      rule: "WEIGHT_INVALID",
      severity: "warning",
      message: `Weight ${product.weight}g is below minimum (${MIN_WEIGHT_GRAMS}g). Please enter accurate weight.`,
      field: "weight",
    });
  }
  if (product.weight > MAX_WEIGHT_GRAMS) {
    violations.push({
      rule: "WEIGHT_EXCEEDS_LIMIT",
      severity: "warning",
      message: `Weight ${product.weight}g exceeds maximum delivery limit (${MAX_WEIGHT_GRAMS}g / 50kg). Contact support for heavy items.`,
      field: "weight",
    });
  }

  // Rule 4: Dimension sanity
  if (product.dimensions) {
    const { l, w, h } = product.dimensions;
    if (l > MAX_DIMENSION_CM || w > MAX_DIMENSION_CM || h > MAX_DIMENSION_CM) {
      violations.push({
        rule: "DIMENSIONS_EXCEED_LIMIT",
        severity: "warning",
        message: `Dimensions exceed maximum (${MAX_DIMENSION_CM}cm per side). Oversized items require special logistics.`,
        field: "dimensions",
      });
    }
    if (l < MIN_DIMENSION_CM || w < MIN_DIMENSION_CM || h < MIN_DIMENSION_CM) {
      violations.push({
        rule: "DIMENSIONS_INVALID",
        severity: "info",
        message: `One or more dimensions are below ${MIN_DIMENSION_CM}cm. Please verify measurements.`,
        field: "dimensions",
      });
    }
  }

  // Rule 5: Image requirement (for submission, not draft)
  if (!product.images || product.images.length === 0) {
    violations.push({
      rule: "NO_IMAGES",
      severity: "warning",
      message: "At least one product image is required for marketplace listing. Products without images cannot be approved.",
      field: "images",
    });
  }

  // Rule 6: Description quality
  if (!product.description || product.description.trim().length < 20) {
    violations.push({
      rule: "DESCRIPTION_TOO_SHORT",
      severity: "info",
      message: "Product description should be at least 20 characters for better buyer experience. Short descriptions may delay approval.",
      field: "description",
    });
  }

  // Rule 7: Name quality
  if (product.name.length < 5) {
    violations.push({
      rule: "NAME_TOO_SHORT",
      severity: "warning",
      message: "Product name should be at least 5 characters and clearly describe the item.",
      field: "name",
    });
  }

  // Rule 8: Suspicious pricing (price = 0.01 or similar)
  if (product.price > 0 && product.price < 0.5) {
    violations.push({
      rule: "SUSPICIOUS_PRICE",
      severity: "info",
      message: "Very low price detected. Ensure this is the final consumer price including all taxes.",
      field: "price",
    });
  }

  // ===== DETERMINE AUTO-ACTION =====
  const hasCritical = violations.some((v) => v.severity === "critical");
  const hasWarning = violations.some((v) => v.severity === "warning");

  let autoAction: "approve" | "reject" | "review";
  let reason: string;

  if (hasCritical) {
    // Critical violations = auto-reject
    autoAction = "reject";
    reason = violations.filter((v) => v.severity === "critical").map((v) => v.message).join("; ");
  } else if (hasWarning) {
    // Warnings = needs manual review
    autoAction = "review";
    reason = `Product has ${violations.filter((v) => v.severity === "warning").length} warning(s) requiring manual review.`;
  } else if (
    storeContext.trustScore >= 80 &&
    storeContext.previousRejections === 0 &&
    product.images && product.images.length > 0
  ) {
    // Trusted merchant, no violations, has images = auto-approve
    autoAction = "approve";
    reason = "Auto-approved: Trusted merchant (score ≥80), no violations, complete listing.";
  } else {
    // No violations but not trusted enough for auto-approve
    autoAction = "review";
    reason = "Product passed automated checks. Awaiting manual review.";
  }

  return {
    passed: !hasCritical,
    violations,
    autoAction,
    reason,
  };
}

// ===== HELPER: Format violations for moderationNote =====
export function formatViolationsForNote(result: ModerationResult): string {
  if (result.violations.length === 0) return result.reason;

  const lines = result.violations.map((v) => {
    const icon = v.severity === "critical" ? "🚫" : v.severity === "warning" ? "⚠️" : "ℹ️";
    return `${icon} [${v.rule}] ${v.message}`;
  });

  return `Auto-moderation: ${result.autoAction.toUpperCase()}\n${lines.join("\n")}`;
}
