import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("PROFILE-377 cropper integration", () => {
  it("renders source aspect geometry instead of relying on a square image pre-crop", () => {
    const cropper = source("components/image-cropper.tsx");

    expect(cropper).toContain("getCoverGeometry");
    expect(cropper).toContain("geometry.displayWidth");
    expect(cropper).toContain("geometry.displayHeight");
    expect(cropper).toContain('style={{ width: "100%", height: "100%" }}');
    expect(cropper).toContain('resizeMode="stretch"');
  });

  it("uses the same geometry for the persisted source rectangle", () => {
    const cropper = source("components/image-cropper.tsx");

    expect(cropper).toContain("getSourceCropRect({");
    expect(cropper).toContain("scale: savedScale.value");
    expect(cropper).toContain("translateX: savedTranslateX.value");
    expect(cropper).toContain("translateY: savedTranslateY.value");
    expect(cropper).toContain("originX: Math.round(cropRect.originX)");
    expect(cropper).toContain("originY: Math.round(cropRect.originY)");
  });

  it("prevents zooming below cover scale and keeps translation independent of scale", () => {
    const cropper = source("components/image-cropper.tsx");

    expect(cropper).toContain("const MIN_SCALE = 1");
    expect(cropper).toContain("animatedTranslateStyle");
    expect(cropper).toContain("animatedScaleStyle");
    expect(cropper).toContain("Translation and scale are deliberately separated into nested views");
  });

  it("shows an explicit loading state while the newly persisted avatar is fetched", () => {
    const profile = source("app/(tabs)/profile.tsx");

    expect(profile).toContain("photoLoading");
    expect(profile).toContain("onLoadStart={() => setPhotoLoading(true)}");
    expect(profile).toContain("<ActivityIndicator");
    expect(profile).toContain("setPhotoLoading(Boolean(url))");
  });
});
