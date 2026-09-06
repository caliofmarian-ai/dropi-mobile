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
import {
  getCoverGeometry,
  getSourceCropRect,
} from "@/lib/profile-photo-crop";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_SIZE = Math.min(SCREEN_WIDTH - 48, 300);
const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface ImageCropperProps {
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

/**
 * Image cropper with pinch-to-zoom and pan gestures.
 *
 * The preview renders the real source aspect ratio at cover scale rather than
 * asking React Native to pre-crop a square via resizeMode="cover". The same
 * cover geometry is then converted back to source coordinates for the persisted
 * crop, so the visible circle and saved image represent the same region.
 */
export function ImageCropper({ imageUri, onCropComplete, onCancel }: ImageCropperProps) {
  const colors = useColors();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setCurrentScale(1);
    setImageSize({ width: 0, height: 0 });

    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });
      },
      () => {
        setImageSize({ width: 1000, height: 1000 });
      },
    );
  }, [imageUri, savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

  const geometry = imageSize.width > 0 && imageSize.height > 0
    ? getCoverGeometry(imageSize.width, imageSize.height, CONTAINER_SIZE)
    : { baseScale: 1, displayWidth: CONTAINER_SIZE, displayHeight: CONTAINER_SIZE };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      const maxX = Math.max(0, (geometry.displayWidth * scale.value - CONTAINER_SIZE) / 2);
      const maxY = Math.max(0, (geometry.displayHeight * scale.value - CONTAINER_SIZE) / 2);
      translateX.value = Math.min(Math.max(translateX.value, -maxX), maxX);
      translateY.value = Math.min(Math.max(translateY.value, -maxY), maxY);
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(setCurrentScale)(scale.value);
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const maxX = Math.max(0, (geometry.displayWidth * scale.value - CONTAINER_SIZE) / 2);
      const maxY = Math.max(0, (geometry.displayHeight * scale.value - CONTAINER_SIZE) / 2);
      translateX.value = Math.min(
        Math.max(savedTranslateX.value + event.translationX, -maxX),
        maxX,
      );
      translateY.value = Math.min(
        Math.max(savedTranslateY.value + event.translationY, -maxY),
        maxY,
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

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

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const allGestures = Gesture.Exclusive(doubleTapGesture, composedGesture);

  // Translation and scale are deliberately separated into nested views so
  // translation remains measured in final viewport pixels and is not scaled.
  const animatedTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));
  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleReset = () => {
    scale.value = withTiming(1, { duration: 200 });
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setCurrentScale(1);
  };

  const handleZoomIn = () => {
    const newScale = Math.min(savedScale.value + 0.3, MAX_SCALE);
    scale.value = withTiming(newScale, { duration: 150 });
    savedScale.value = newScale;
    setCurrentScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(savedScale.value - 0.3, MIN_SCALE);
    const maxX = Math.max(0, (geometry.displayWidth * newScale - CONTAINER_SIZE) / 2);
    const maxY = Math.max(0, (geometry.displayHeight * newScale - CONTAINER_SIZE) / 2);
    const nextX = Math.min(Math.max(savedTranslateX.value, -maxX), maxX);
    const nextY = Math.min(Math.max(savedTranslateY.value, -maxY), maxY);

    scale.value = withTiming(newScale, { duration: 150 });
    translateX.value = withTiming(nextX, { duration: 150 });
    translateY.value = withTiming(nextY, { duration: 150 });
    savedScale.value = newScale;
    savedTranslateX.value = nextX;
    savedTranslateY.value = nextY;
    setCurrentScale(newScale);
  };

  const handleCrop = async () => {
    setProcessing(true);
    try {
      if (imageSize.width === 0 || imageSize.height === 0) {
        onCropComplete(imageUri);
        return;
      }

      const cropRect = getSourceCropRect({
        imageWidth: imageSize.width,
        imageHeight: imageSize.height,
        containerSize: CONTAINER_SIZE,
        scale: savedScale.value,
        translateX: savedTranslateX.value,
        translateY: savedTranslateY.value,
      });

      if (Platform.OS === "web") {
        const croppedUri = await cropWithCanvas(
          imageUri,
          cropRect.originX,
          cropRect.originY,
          cropRect.width,
          cropRect.height,
        );
        onCropComplete(croppedUri);
      } else {
        const ImageManipulator = require("expo-image-manipulator");
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              crop: {
                originX: Math.round(cropRect.originX),
                originY: Math.round(cropRect.originY),
                width: Math.round(cropRect.width),
                height: Math.round(cropRect.height),
              },
            },
            { resize: { width: 500, height: 500 } },
          ],
          {
            compress: 0.85,
            format: ImageManipulator.SaveFormat.JPEG,
          },
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
      <View className="items-center mb-3">
        <Text className="text-sm font-medium text-foreground">
          Pinch to zoom, drag to position
        </Text>
        <Text className="text-xs text-muted mt-1">
          Double-tap to reset
        </Text>
      </View>

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
                  position: "absolute",
                  left: (CONTAINER_SIZE - geometry.displayWidth) / 2,
                  top: (CONTAINER_SIZE - geometry.displayHeight) / 2,
                  width: geometry.displayWidth,
                  height: geometry.displayHeight,
                },
                animatedTranslateStyle,
              ]}
            >
              <Animated.View
                style={[
                  { width: "100%", height: "100%" },
                  animatedScaleStyle,
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="stretch"
                />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>

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

async function cropWithCanvas(
  uri: string,
  originX: number,
  originY: number,
  width: number,
  height: number,
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
        500,
      );
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}
