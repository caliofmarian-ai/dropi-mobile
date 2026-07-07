// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
const rawBundleId = "space.manus.dropi.mobile.t20260627";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase()
    .split(".")
    .map((segment) => {
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.manus.app";

const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

// EAS Project ID — înlocuiește YOUR_EAS_PROJECT_ID cu ID-ul real din https://expo.dev
// Pași: expo.dev → Projects → dropi-mobile → copiază Project ID → editează acest fișier
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? "YOUR_EAS_PROJECT_ID";
if (EAS_PROJECT_ID === "YOUR_EAS_PROJECT_ID") {
  console.warn(
    "\n⚠️  [app.config.ts] EAS_PROJECT_ID nu este configurat!\n" +
    "   EAS Updates (OTA) NU vor funcționa fără un Project ID real.\n" +
    "   → Urmează pașii din docs/MOBILE_FIRST_SETUP.md, Pasul 1.\n"
  );
}

const env = {
  appName: "DROPi",
  appSlug: "dropi-mobile",
  logoUrl: "/manus-storage/dropi-icon_40f34a24.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  // EAS Updates — Over-The-Air updates fără reconstruire APK
  // Înlocuiește YOUR_EAS_PROJECT_ID urmând pașii din docs/MOBILE_FIRST_SETUP.md
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: "ON_LOAD",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0066FF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0066FF",
        dark: {
          backgroundColor: "#001A40",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
