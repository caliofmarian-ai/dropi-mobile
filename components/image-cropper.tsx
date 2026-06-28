import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

const CROP_SIZE = 280;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_SIZE = Math.min(SCREEN_WIDTH - 48, 320);

interface ImageCropperProps {
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

/**
 * A simple image cropper that allows users to adjust zoom level
 * and position before cropping to a square.
 * Uses expo-image-manipulator for the actual crop operation.
 */
export function ImageCropper({ imageUri, onCropComplete, onCancel }: ImageCropperProps) {
  const colors = useColors();
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);

  // Get image dimensions on load
  const handleImageLoad = () => {
    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });
      },
      () => {
        // Fallback: assume square
        setImageSize({ width: 1000, height: 1000 });
      }
    );
  };

  // Zoom controls
  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  // Pan controls
  const panStep = 20;
  const panUp = () => setOffsetY((y) => y - panStep);
  const panDown = () => setOffsetY((y) => y + panStep);
  const panLeft = () => setOffsetX((x) => x - panStep);
  const panRight = () => setOffsetX((x) => x + panStep);

  // Reset position
  const resetPosition = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleCrop = async () => {
    setProcessing(true);
    try {
      if (imageSize.width === 0 || imageSize.height === 0) {
        // Can't crop without dimensions, just pass through
        onCropComplete(imageUri);
        return;
      }

      // Calculate the crop region based on the visible area
      // The image is displayed at a certain scale within the container
      const displayScale = CONTAINER_SIZE / Math.min(imageSize.width, imageSize.height);
      const effectiveScale = displayScale * scale;

      // The crop area in image coordinates
      const cropSizeInImage = CONTAINER_SIZE / effectiveScale;
      const centerX = imageSize.width / 2 - offsetX / effectiveScale;
      const centerY = imageSize.height / 2 - offsetY / effectiveScale;

      let originX = Math.max(0, centerX - cropSizeInImage / 2);
      let originY = Math.max(0, centerY - cropSizeInImage / 2);
      let cropWidth = Math.min(cropSizeInImage, imageSize.width - originX);
      let cropHeight = Math.min(cropSizeInImage, imageSize.height - originY);

      // Ensure square crop
      const cropDim = Math.min(cropWidth, cropHeight);
      cropWidth = cropDim;
      cropHeight = cropDim;

      if (Platform.OS === "web") {
        // Web: use canvas for cropping
        const croppedUri = await cropWithCanvas(
          imageUri,
          originX,
          originY,
          cropWidth,
          cropHeight
        );
        onCropComplete(croppedUri);
      } else {
        // Native: use expo-image-manipulator
        const ImageManipulator = require("expo-image-manipulator");
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              crop: {
                originX: Math.round(originX),
                originY: Math.round(originY),
                width: Math.round(cropWidth),
                height: Math.round(cropHeight),
              },
            },
            { resize: { width: 500, height: 500 } },
          ],
          {
            compress: 0.85,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        onCropComplete(result.uri);
      }
    } catch (err: any) {
      console.error("Crop error:", err);
      // Fallback: just pass the original image
      onCropComplete(imageUri);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Crop Area */}
      <View className="items-center mb-4">
        <Text className="text-sm font-medium text-foreground mb-3">
          Adjust your photo, then tap Crop
        </Text>

        {/* Crop container with circular mask */}
        <View
          style={{
            width: CONTAINER_SIZE,
            height: CONTAINER_SIZE,
            borderRadius: CONTAINER_SIZE / 2,
            overflow: "hidden",
            borderWidth: 3,
            borderColor: colors.primary,
            backgroundColor: colors.surface,
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{
              width: CONTAINER_SIZE * scale,
              height: CONTAINER_SIZE * scale,
              transform: [
                { translateX: offsetX + (CONTAINER_SIZE - CONTAINER_SIZE * scale) / 2 },
                { translateY: offsetY + (CONTAINER_SIZE - CONTAINER_SIZE * scale) / 2 },
              ],
            }}
            resizeMode="cover"
            onLoad={handleImageLoad}
          />
        </View>

        {/* Hint */}
        <Text className="text-xs text-muted mt-2">
          Use controls below to zoom and position
        </Text>
      </View>

      {/* Zoom Controls */}
      <View className="flex-row items-center justify-center gap-4 mb-3">
        <TouchableOpacity
          onPress={zoomOut}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-foreground text-lg font-bold">−</Text>
        </TouchableOpacity>

        <Text className="text-sm text-muted font-medium" style={{ minWidth: 50, textAlign: "center" }}>
          {Math.round(scale * 100)}%
        </Text>

        <TouchableOpacity
          onPress={zoomIn}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-foreground text-lg font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Pan Controls (D-pad style) */}
      <View className="items-center mb-4">
        <TouchableOpacity onPress={panUp} style={panButtonStyle(colors)}>
          <Text className="text-foreground text-sm">▲</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-6">
          <TouchableOpacity onPress={panLeft} style={panButtonStyle(colors)}>
            <Text className="text-foreground text-sm">◀</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetPosition} style={resetButtonStyle(colors)}>
            <Text className="text-xs text-muted">Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={panRight} style={panButtonStyle(colors)}>
            <Text className="text-foreground text-sm">▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={panDown} style={panButtonStyle(colors)}>
          <Text className="text-foreground text-sm">▼</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onCancel}
          disabled={processing}
          className="flex-1 border border-border rounded-xl py-3.5 items-center"
        >
          <Text className="text-muted font-medium">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCrop}
          disabled={processing}
          className="flex-1 bg-primary rounded-xl py-3.5 items-center"
        >
          {processing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-background font-semibold">Crop & Use</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function panButtonStyle(colors: any) {
  return {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    margin: 2,
  };
}

function resetButtonStyle(colors: any) {
  return {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
}

/**
 * Web-only: crop image using canvas
 */
async function cropWithCanvas(
  uri: string,
  originX: number,
  originY: number,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(uri); // fallback
        return;
      }
      ctx.drawImage(
        img,
        Math.round(originX),
        Math.round(originY),
        Math.round(width),
        Math.round(height),
        0,
        0,
        500,
        500
      );
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(croppedDataUrl);
    };
    img.onerror = () => resolve(uri); // fallback on error
    img.src = uri;
  });
}
