import { describe, expect, it } from "vitest";
import {
  VERIFICATION_EXPIRY_WARNING_DAYS,
  deriveVerificationLifecycle,
  latestVerificationByDocumentType,
} from "../shared/verification-lifecycle";

describe("VER-378 verification lifecycle", () => {
  const now = new Date("2026-09-06T12:00:00.000Z");

  it("uses a documented 30 day approaching-expiry threshold", () => {
    expect(VERIFICATION_EXPIRY_WARNING_DAYS).toBe(30);

    const boundary = deriveVerificationLifecycle({
      status: "approved",
      expiryDate: "2026-10-06T00:00:00.000Z",
    }, now);
    expect(boundary.state).toBe("expiring");
    expect(boundary.daysUntilExpiry).toBe(30);

    const outside = deriveVerificationLifecycle({
      status: "approved",
      expiryDate: "2026-10-07T00:00:00.000Z",
    }, now);
    expect(outside.state).toBe("approved");
    expect(outside.daysUntilExpiry).toBe(31);
  });

  it("keeps pending and rejected decisions authoritative over expiry presentation", () => {
    expect(deriveVerificationLifecycle({ status: "pending", expiryDate: "2026-09-01" }, now).state).toBe("pending");
    expect(deriveVerificationLifecycle({ status: "rejected", expiryDate: "2027-09-01" }, now).state).toBe("rejected");
  });

  it("marks approved evidence expired only after the expiry day", () => {
    expect(deriveVerificationLifecycle({ status: "approved", expiryDate: "2026-09-05" }, now).state).toBe("expired");
    expect(deriveVerificationLifecycle({ status: "approved", expiryDate: "2026-09-06" }, now).state).toBe("expiring");
  });

  it("keeps approved evidence without an expiry date approved", () => {
    const lifecycle = deriveVerificationLifecycle({ status: "approved", expiryDate: null }, now);
    expect(lifecycle.state).toBe("approved");
    expect(lifecycle.expiryDate).toBeNull();
  });

  it("selects the newest record per document type as current while preserving older history separately", () => {
    const records = [
      { id: 1, documentType: "driving_license", createdAt: "2026-08-01" },
      { id: 2, documentType: "driving_license", createdAt: "2026-09-01" },
      { id: 3, documentType: "insurance", createdAt: "2026-08-15" },
    ];
    const latest = latestVerificationByDocumentType(records);
    expect(latest.get("driving_license")?.id).toBe(2);
    expect(latest.get("insurance")?.id).toBe(3);
    expect(records).toHaveLength(3);
  });
});
