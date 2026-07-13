import * as Auth from "./auth";

export async function getTrpcAuthHeaders(): Promise<Record<string, string>> {
  const token = await Auth.getSessionToken();
  return token ? { Authorization: ["Bearer", token].join(" ") } : {};
}
