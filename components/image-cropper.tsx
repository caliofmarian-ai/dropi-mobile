import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_SIZE = Math.min(SCREEN_WIDTH - 48, 300);

interface ImageCropperProps {
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

/**
 * Image cropper with pinch-to-zoom and pan gestures.
 * Uses react-native-gesture-handler for natural touch interactions
 * and expo-image-manipulator for the actual crop operation.
 */
export function ImageCropper({ imageUri, onCropComplete, onCancel }: ImageCropperProps) {
  const colors = useColors();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);

  // Shared values for gestures
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Get image dimensions on mount
  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });
      },
      () => {
        setImageSize({ width: 1000, height: 1000 });
      }
    );
  }, [imageUri]);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.5), 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(setCurrentScale)(scale.value);
    });

  // Pan gesture for moving the image
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const maxTranslate = (CONTAINER_SIZE * scale.value - CONTAINER_SIZE) / 2;
      translateX.value = Math.min(
        Math.max(savedTranslateX.value + e.translationX, -maxTranslate),
        maxTranslate
      );
      translateY.value = Math.min(
        Math.max(savedTranslateY.value + e.translationY, -maxTranslate),
        maxTranslate
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double-tap to reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      scale.value = withTiming(1, { duration: 250 });
      translateX.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(0, { duration: 250 });
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      runOnJS(setCurrentScale)(1);
    });

  // Compose gestures: pinch and pan are simultaneous, double-tap is exclusive
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const allGestures = Gesture.Exclusive(doubleTapGesture, composedGesture);

  // Animated style for the image
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Reset function
  const handleReset = () => {
    scale.value = withTiming(1, { duration: 200 });
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setCurrentScale(1);
  };

  // Zoom button controls (fallback for web or accessibility)
  const handleZoomIn = () => {
    const newScale = Math.min(savedScale.value + 0.3, 5);
    scale.value = withTiming(newScale, { duration: 150 });
    savedScale.value = newScale;
    setCurrentScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(savedScale.value - 0.3, 0.5);
    scale.value = withTiming(newScale, { duration: 150 });
    savedScale.value = newScale;
    setCurrentScale(newScale);
  };

  const handleCrop = async () => {
    setProcessing(true);
    try {
      if (imageSize.width === 0 || imageSize.height === 0) {
        onCropComplete(imageUri);
        return;
      }

      // Calculate the crop region based on current transform
      const currentScaleVal = savedScale.value;
      const currentTX = savedTranslateX.value;
      const currentTY = savedTranslateY.value;

      const displayScale = CONTAINER_SIZE / Math.min(imageSize.width, imageSize.height);
      const effectiveScale = displayScale * currentScaleVal;

      // The visible crop area in image coordinates
      const cropSizeInImage = CONTAINER_SIZE / effectiveScale;
      const centerX = imageSize.width / 2 - currentTX / effectiveScale;
      const centerY = imageSize.height / 2 - currentTY / effectiveScale;

      let originX = Math.max(0, centerX - cropSizeInImage / 2);
      let originY = Math.max(0, centerY - cropSizeInImage / 2);
      let cropWidth = Math.min(cropSizeInImage, imageSize.width - originX);
      let cropHeight = Math.min(cropSizeInImage, imageSize.height - originY);

      // Ensure square crop
      const cropDim = Math.min(cropWidth, cropHeight);
      cropWidth = cropDim;
      cropHeight = cropDim;

      if (Platform.OS === "web") {
        const croppedUri = await cropWithCanvas(
          imageUri,
          originX,
          originY,
          cropWidth,
          cropHeight
        );
        onCropComplete(croppedUri);
      } else {
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
      onCropComplete(imageUri);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Instructions */}
      <View className="items-center mb-3">
        <Text className="text-sm font-medium text-foreground">
          Pinch to zoom, drag to position
        </Text>
        <Text className="text-xs text-muted mt-1">
          Double-tap to reset
        </Text>
      </View>

      {/* Crop Area with Gesture Handler */}
      <View className="items-center mb-4">
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
          <GestureDetector gesture={allGestures}>
            <Animated.View
              style={[
                {
                  width: CONTAINER_SIZE,
                  height: CONTAINER_SIZE,
                  alignItems: "center",
                  justifyContent: "center",
                },
                animatedImageStyle,
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: CONTAINER_SIZE,
                  height: CONTAINER_SIZE,
                }}
                resizeMode="cover"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </View>

      {/* Zoom Controls (buttons for accessibility / web fallback) */}
      <View className="flex-row items-center justify-center gap-4 mb-4">
        <TouchableOpacity
          onPress={handleZoomOut}
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
          {Math.round(currentScale * 100)}%
        </Text>

        <TouchableOpacity
          onPress={handleZoomIn}
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

        <TouchableOpacity
          onPress={handleReset}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text className="text-xs text-muted font-medium">Reset</Text>
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
  return new Promise((resolve) => {
    const img = new (window as any).Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(uri);
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
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}
