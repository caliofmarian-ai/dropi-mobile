export type CoverGeometry = {
  baseScale: number;
  displayWidth: number;
  displayHeight: number;
};

export type CropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
  return value;
}

function clamp(value: number, min: number, max: number): number {
  const result = Math.min(Math.max(value, min), max);
  return result === 0 ? 0 : result;
}

/**
 * Geometry used by the crop preview. The source image is scaled until it covers
 * the square crop viewport while preserving its original aspect ratio.
 */
export function getCoverGeometry(
  imageWidth: number,
  imageHeight: number,
  containerSize: number,
): CoverGeometry {
  const width = positive(imageWidth, "imageWidth");
  const height = positive(imageHeight, "imageHeight");
  const container = positive(containerSize, "containerSize");
  const baseScale = Math.max(container / width, container / height);

  return {
    baseScale,
    displayWidth: width * baseScale,
    displayHeight: height * baseScale,
  };
}

export function getTranslationBounds(
  geometry: CoverGeometry,
  scale: number,
  containerSize: number,
) {
  const safeScale = Math.max(1, scale);
  const container = positive(containerSize, "containerSize");
  return {
    maxX: Math.max(0, (geometry.displayWidth * safeScale - container) / 2),
    maxY: Math.max(0, (geometry.displayHeight * safeScale - container) / 2),
  };
}

export function clampTranslation(
  geometry: CoverGeometry,
  scale: number,
  containerSize: number,
  translateX: number,
  translateY: number,
) {
  const bounds = getTranslationBounds(geometry, scale, containerSize);
  return {
    translateX: clamp(translateX, -bounds.maxX, bounds.maxX),
    translateY: clamp(translateY, -bounds.maxY, bounds.maxY),
  };
}

/**
 * Convert the exact preview transform back into source-image coordinates.
 * Translation is expressed in viewport pixels and therefore divided by the
 * effective source-to-preview scale. The resulting rectangle is always square
 * and clamped inside the source image.
 */
export function getSourceCropRect(input: {
  imageWidth: number;
  imageHeight: number;
  containerSize: number;
  scale: number;
  translateX: number;
  translateY: number;
}): CropRect {
  const {
    imageWidth,
    imageHeight,
    containerSize,
  } = input;
  const geometry = getCoverGeometry(imageWidth, imageHeight, containerSize);
  const safeScale = Math.max(1, input.scale);
  const translated = clampTranslation(
    geometry,
    safeScale,
    containerSize,
    input.translateX,
    input.translateY,
  );
  const effectiveScale = geometry.baseScale * safeScale;
  const cropSize = Math.min(
    containerSize / effectiveScale,
    imageWidth,
    imageHeight,
  );
  const centerX = imageWidth / 2 - translated.translateX / effectiveScale;
  const centerY = imageHeight / 2 - translated.translateY / effectiveScale;
  const maxOriginX = Math.max(0, imageWidth - cropSize);
  const maxOriginY = Math.max(0, imageHeight - cropSize);

  return {
    originX: clamp(centerX - cropSize / 2, 0, maxOriginX),
    originY: clamp(centerY - cropSize / 2, 0, maxOriginY),
    width: cropSize,
    height: cropSize,
  };
}
