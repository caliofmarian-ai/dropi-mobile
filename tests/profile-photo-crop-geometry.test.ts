import { describe, expect, it } from "vitest";
import {
  clampTranslation,
  getCoverGeometry,
  getSourceCropRect,
  getTranslationBounds,
} from "../lib/profile-photo-crop";

describe("profile photo crop geometry", () => {
  it("centers a portrait image using the same cover geometry as the preview", () => {
    const geometry = getCoverGeometry(1000, 2000, 300);
    expect(geometry.baseScale).toBeCloseTo(0.3);
    expect(geometry.displayWidth).toBeCloseTo(300);
    expect(geometry.displayHeight).toBeCloseTo(600);

    const rect = getSourceCropRect({
      imageWidth: 1000,
      imageHeight: 2000,
      containerSize: 300,
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 0, originY: 500, width: 1000, height: 1000 });
  });

  it("centers a landscape image without silently changing the visible region", () => {
    const rect = getSourceCropRect({
      imageWidth: 2000,
      imageHeight: 1000,
      containerSize: 300,
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 500, originY: 0, width: 1000, height: 1000 });
  });

  it("uses the complete square source at the default scale", () => {
    const rect = getSourceCropRect({
      imageWidth: 1200,
      imageHeight: 1200,
      containerSize: 300,
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 0, originY: 0, width: 1200, height: 1200 });
  });

  it("maps portrait panning to the corresponding source edge", () => {
    const geometry = getCoverGeometry(1000, 2000, 300);
    const bounds = getTranslationBounds(geometry, 1, 300);
    expect(bounds.maxX).toBe(0);
    expect(bounds.maxY).toBe(150);

    const top = getSourceCropRect({
      imageWidth: 1000,
      imageHeight: 2000,
      containerSize: 300,
      scale: 1,
      translateX: 0,
      translateY: 150,
    });
    expect(top.originY).toBeCloseTo(0);

    const bottom = getSourceCropRect({
      imageWidth: 1000,
      imageHeight: 2000,
      containerSize: 300,
      scale: 1,
      translateX: 0,
      translateY: -150,
    });
    expect(bottom.originY).toBeCloseTo(1000);
  });

  it("keeps zoomed crop square and centered when no translation is applied", () => {
    const rect = getSourceCropRect({
      imageWidth: 1000,
      imageHeight: 2000,
      containerSize: 300,
      scale: 2,
      translateX: 0,
      translateY: 0,
    });
    expect(rect.width).toBeCloseTo(500);
    expect(rect.height).toBeCloseTo(500);
    expect(rect.originX).toBeCloseTo(250);
    expect(rect.originY).toBeCloseTo(750);
  });

  it("never allows translation that would expose empty space", () => {
    const geometry = getCoverGeometry(2000, 1000, 300);
    const clamped = clampTranslation(geometry, 1, 300, 999, -999);
    expect(clamped.translateX).toBe(150);
    expect(clamped.translateY).toBe(0);
  });

  it("never zooms below cover scale in source conversion", () => {
    const rect = getSourceCropRect({
      imageWidth: 1000,
      imageHeight: 2000,
      containerSize: 300,
      scale: 0.25,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 0, originY: 500, width: 1000, height: 1000 });
  });
});
