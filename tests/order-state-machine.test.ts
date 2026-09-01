import { describe, expect, it } from "vitest";
import {
  assertOrderTransitionAuthorized,
  CANONICAL_ORDER_STATES,
  getAllowedOrderTransitions,
  OrderTransitionError,
} from "../server/order-state-machine";

const baseOrder = {
  customerId: 10,
  merchantId: 20,
  pilotId: null,
  status: "initiated" as const,
};

const customer = { id: 10, dropiRole: "customer", role: "user", isActive: true, isVerified: true };
const merchant = { id: 20, dropiRole: "merchant", role: "user", isActive: true, isVerified: true };
const pilot = { id: 30, dropiRole: "delivery_partner", role: "user", isActive: true, isVerified: true };
const admin = { id: 40, dropiRole: "system_administrator", role: "admin", isActive: true, isVerified: true };

describe("canonical Marketplace order state machine", () => {
  it("preserves the exact canonical happy-path order", () => {
    expect(CANONICAL_ORDER_STATES).toEqual([
      "initiated",
      "validated",
      "preparing",
      "ready",
      "accepted",
      "in_execution",
      "completed",
    ]);
  });

  it("does not allow execution or acceptance before READY", () => {
    expect(getAllowedOrderTransitions("preparing", "delivery_partner")).toEqual([]);
    expect(() =>
      assertOrderTransitionAuthorized({ ...baseOrder, status: "preparing" }, pilot, "accepted"),
    ).toThrow(OrderTransitionError);
    expect(() =>
      assertOrderTransitionAuthorized({ ...baseOrder, status: "ready" }, pilot, "in_execution"),
    ).toThrow(OrderTransitionError);
  });

  it("requires the owning merchant for validation, preparation and READY", () => {
    expect(assertOrderTransitionAuthorized(baseOrder, merchant, "validated").actorKind).toBe("merchant");
    expect(
      assertOrderTransitionAuthorized({ ...baseOrder, status: "validated" }, merchant, "preparing").actorKind,
    ).toBe("merchant");
    expect(
      assertOrderTransitionAuthorized({ ...baseOrder, status: "preparing" }, merchant, "ready").actorKind,
    ).toBe("merchant");

    expect(() =>
      assertOrderTransitionAuthorized(baseOrder, { ...merchant, id: 999 }, "validated"),
    ).toThrowError(/another merchant/);
  });

  it("keeps READY acceptance voluntary to a verified active delivery partner", () => {
    const ready = { ...baseOrder, status: "ready" as const };
    expect(assertOrderTransitionAuthorized(ready, pilot, "accepted")).toEqual({
      actorKind: "delivery_partner",
      assignPilotId: 30,
    });

    expect(() => assertOrderTransitionAuthorized(ready, { ...pilot, isVerified: false }, "accepted")).toThrowError(
      /Verified delivery-partner/,
    );
    expect(() => assertOrderTransitionAuthorized(ready, admin, "accepted")).toThrowError(/admin cannot perform/);
  });

  it("requires the assigned pilot for execution and completion", () => {
    const accepted = { ...baseOrder, status: "accepted" as const, pilotId: 30 };
    expect(assertOrderTransitionAuthorized(accepted, pilot, "in_execution").actorKind).toBe("delivery_partner");
    expect(() =>
      assertOrderTransitionAuthorized(accepted, { ...pilot, id: 31 }, "in_execution"),
    ).toThrowError(/assigned pilot/);

    expect(
      assertOrderTransitionAuthorized({ ...accepted, status: "in_execution" }, pilot, "completed").actorKind,
    ).toBe("delivery_partner");
  });

  it("allows cancellation before acceptance but never uses cancellation to bypass READY", () => {
    for (const status of ["initiated", "validated", "preparing", "ready"] as const) {
      const order = { ...baseOrder, status };
      expect(getAllowedOrderTransitions(status, "customer")).toContain("cancelled");
      expect(assertOrderTransitionAuthorized(order, customer, "cancelled").actorKind).toBe("customer");
    }

    expect(() =>
      assertOrderTransitionAuthorized({ ...baseOrder, status: "accepted", pilotId: 30 }, customer, "cancelled"),
    ).toThrow(OrderTransitionError);
  });

  it("keeps fallback exceptional and post-acceptance", () => {
    expect(() => assertOrderTransitionAuthorized({ ...baseOrder, status: "ready" }, pilot, "fallback")).toThrow();
    expect(
      assertOrderTransitionAuthorized({ ...baseOrder, status: "in_execution", pilotId: 30 }, pilot, "fallback").actorKind,
    ).toBe("delivery_partner");
    expect(
      assertOrderTransitionAuthorized({ ...baseOrder, status: "fallback", pilotId: 30 }, admin, "cancelled").actorKind,
    ).toBe("admin");
  });
});
