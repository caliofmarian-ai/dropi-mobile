/**
 * DROPi Notification Sound — Sprint 6B+
 *
 * Plays a short notification chime when a new in-app notification arrives.
 * Uses expo-audio with silent mode bypass on iOS.
 * Sound is loaded once and reused for performance.
 */
import { Platform } from "react-native";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useEffect, useRef } from "react";

// Use a bundled notification sound asset
// This is a short, pleasant chime suitable for notifications
const NOTIFICATION_SOUND = require("@/assets/sounds/notification.mp3");

/**
 * Hook that provides a playNotificationSound function.
 * Loads the sound once and replays on each call.
 * Must be mounted in a component that persists (e.g., _layout.tsx).
 */
export function useNotificationSound() {
  const player = useAudioPlayer(NOTIFICATION_SOUND);
  const initialized = useRef(false);

  useEffect(() => {
    // Enable playback in iOS silent mode
    if (!initialized.current && Platform.OS !== "web") {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      initialized.current = true;
    }

    return () => {
      player.release();
    };
  }, [player]);

  const playNotificationSound = () => {
    if (Platform.OS === "web") return; // Skip on web
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // Silently fail if audio can't play
    }
  };

  return { playNotificationSound };
}
