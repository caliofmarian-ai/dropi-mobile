import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { getApiBaseUrl } from "@/constants/oauth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@dropi_token";

async function apiCall(path: string, input: any) {
  const base = getApiBaseUrl();
  const url = `${base}/api/trpc/${path}`;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ json: input }),
    credentials: "include",
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error?.json?.message || data.error?.message || "API error");
  return data.result?.data?.json ?? data.result?.data;
}

interface ProfilePhotoModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoUploaded: (url: string) => void;
  currentPhotoUrl?: string | null;
}

export function ProfilePhotoModal({
  visible,
  onClose,
  onPhotoUploaded,
  currentPhotoUrl,
}: ProfilePhotoModalProps) {
  const colors = useColors();
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickFromGallery = async () => {
    if (Platform.OS === "web") {
      // Web: use file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const uri = URL.createObjectURL(file);
          setSelectedImage({ uri, name: file.name, type: file.type });
        }
      };
      input.click();
      return;
    }

    // Native: use expo-image-picker
    try {
      const ImagePicker = require("expo-image-picker");
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to pick image: " + (err.message || "Unknown error"));
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Camera capture is only available on mobile devices.");
      return;
    }

    try {
      const ImagePicker = require("expo-image-picker");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to take photo: " + (err.message || "Unknown error"));
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    setUploading(true);

    try {
      let base64: string;

      if (Platform.OS === "web") {
        // Web: fetch blob and convert to base64
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Native: use FileSystem
        const FS = require("expo-file-system/legacy");
        base64 = await FS.readAsStringAsync(selectedImage.uri, {
          encoding: FS.EncodingType.Base64,
        });
      }

      const result = await apiCall("dropiAuth.uploadProfilePhoto", {
        fileBase64: base64,
        contentType: selectedImage.type,
        fileName: selectedImage.name,
      });

      if (result.success && result.url) {
        onPhotoUploaded(result.url);
        Alert.alert("Success", "Profile photo updated!");
        handleClose();
      }
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert("Remove Photo", "Are you sure you want to remove your profile photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await apiCall("dropiAuth.updateProfile", { profilePhotoUrl: "" });
            onPhotoUploaded("");
            setSelectedImage(null);
            onClose();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to remove photo");
          }
        },
      },
    ]);
  };

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View className="bg-background rounded-t-3xl p-6 pb-10">
          {/* Handle bar */}
          <View className="w-10 h-1 bg-border rounded-full self-center mb-5" />

          {/* Title */}
          <Text className="text-xl font-bold text-foreground text-center mb-6">
            Profile Photo
          </Text>

          {/* Preview */}
          <View className="items-center mb-6">
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.surface,
                borderWidth: 3,
                borderColor: colors.primary,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{ width: 120, height: 120 }}
                  resizeMode="cover"
                />
              ) : currentPhotoUrl ? (
                <Image
                  source={{ uri: currentPhotoUrl }}
                  style={{ width: 120, height: 120 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 40 }}>👤</Text>
              )}
            </View>
            {selectedImage && (
              <Text className="text-xs text-muted mt-2">Preview — tap Upload to save</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            {/* Gallery */}
            <TouchableOpacity
              onPress={handlePickFromGallery}
              disabled={uploading}
              className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5"
            >
              <Text className="text-lg mr-3">🖼️</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">Choose from Gallery</Text>
                <Text className="text-xs text-muted">Select an existing photo</Text>
              </View>
            </TouchableOpacity>

            {/* Camera */}
            {Platform.OS !== "web" && (
              <TouchableOpacity
                onPress={handleTakePhoto}
                disabled={uploading}
                className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5"
              >
                <Text className="text-lg mr-3">📷</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">Take a Photo</Text>
                  <Text className="text-xs text-muted">Use your camera</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Upload button (shown when image selected) */}
            {selectedImage && (
              <TouchableOpacity
                onPress={handleUpload}
                disabled={uploading}
                className="bg-primary rounded-xl py-4 items-center mt-2"
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-background font-semibold text-base">Upload Photo</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Remove photo (shown when user has existing photo) */}
            {currentPhotoUrl && !selectedImage && (
              <TouchableOpacity
                onPress={handleRemovePhoto}
                className="py-3 items-center"
              >
                <Text className="text-error text-sm font-medium">Remove Current Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cancel */}
          <TouchableOpacity onPress={handleClose} className="mt-4 py-3 items-center">
            <Text className="text-muted text-sm font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
