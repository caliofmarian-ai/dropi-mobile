/**
 * Notifications Tab — Redirects to the full notification center.
 * This file exists to register the tab in the tab bar with bell icon + badge.
 */
import { Redirect } from "expo-router";

export default function NotificationsTab() {
  return <Redirect href="/notifications" />;
}
