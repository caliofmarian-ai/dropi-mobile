// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // DROPi navigation icons
  "shippingbox.fill": "local-shipping",
  "clock.fill": "history",
  "person.fill": "person",
  "list.bullet": "list",
  "airplane": "flight",
  "bolt.fill": "flash-on",
  "map.fill": "map",
  "bell.fill": "notifications",
  "bus.fill": "directions-bus",
  "exclamationmark.triangle.fill": "warning",
  "stop.fill": "stop",
  "arrow.uturn.left": "undo",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "location.fill": "my-location",
  "gear": "settings",
  "questionmark.circle": "help",
  "shield.fill": "shield",
  "dollarsign.circle.fill": "attach-money",
} as IconMapping;

export { IconSymbolName };

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
