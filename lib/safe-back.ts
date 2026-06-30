/**
 * Safe navigation back utility.
 * Prevents "GO_BACK was not handled by any navigator" error
 * by falling back to the main tabs screen when there's no history.
 */
import { Router } from "expo-router";

export function safeGoBack(router: Router) {
  if (router.canGoBack()) {
    router.back();
  } else {
    // Fallback to main tabs when no history exists
    router.replace("/(tabs)");
  }
}
