import { describe, expect, it } from "vitest";
import {
  OWNER_QA_MISSION_UIDS,
  canActorSeeOwnerQaMission,
  isOwnerQaMissionOrderUid,
  readOwnerQaMissionMetadata,
} from "../shared/owner-qa-mission-fixtures";

function fixtureItems(targetPilotId = 42, kind: "drone" | "terrestrial" = "drone") {
  return [{
    name: "QA parcel",
    quantity: 1,
    ownerQaFixture: {
      issue: 380,
      kind,
      label: kind === "drone" ? "OWNER QA · DRONE · #380" : "OWNER QA · TERRESTRIAL · #380",
      targetPilotId,
      deliveryMode: kind === "drone" ? "drone" : "terrestrial",
      vehicleType: kind === "drone" ? "drone" : "van",
      vehicleId: kind === "drone" ? "QA-DRONE-380" : "QA-VAN-380",
    },
  }];
}

describe("QA-380 owner mission fixture metadata", () => {
  it("recognizes only the two deterministic owner QA UIDs", () => {
    expect(isOwnerQaMissionOrderUid(OWNER_QA_MISSION_UIDS.drone)).toBe(true);
    expect(isOwnerQaMissionOrderUid(OWNER_QA_MISSION_UIDS.terrestrial)).toBe(true);
    expect(isOwnerQaMissionOrderUid("ordinary-order")).toBe(false);
  });

  it("parses a governed drone fixture", () => {
    expect(readOwnerQaMissionMetadata(fixtureItems())).toMatchObject({
      issue: 380,
      kind: "drone",
      targetPilotId: 42,
      deliveryMode: "drone",
      vehicleType: "drone",
      vehicleId: "QA-DRONE-380",
    });
  });

  it("parses a governed terrestrial fixture as a van", () => {
    expect(readOwnerQaMissionMetadata(fixtureItems(42, "terrestrial"))).toMatchObject({
      kind: "terrestrial",
      deliveryMode: "terrestrial",
      vehicleType: "van",
      vehicleId: "QA-VAN-380",
    });
  });

  it("makes fixtures visible only to their target pilot while ordinary orders remain visible", () => {
    expect(canActorSeeOwnerQaMission(fixtureItems(42), 42)).toBe(true);
    expect(canActorSeeOwnerQaMission(fixtureItems(42), 99)).toBe(false);
    expect(canActorSeeOwnerQaMission([{ name: "ordinary" }], 99)).toBe(true);
  });

  it("fails closed for malformed QA metadata", () => {
    const malformed = fixtureItems(42);
    (malformed[0].ownerQaFixture as any).targetPilotId = -1;
    expect(readOwnerQaMissionMetadata(malformed)).toBeNull();
  });
});
