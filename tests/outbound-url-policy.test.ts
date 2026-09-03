import test from "node:test";
import assert from "node:assert/strict";
import { isPrivateOrSpecialIp, validatePublicWebhookUrl } from "../server/outbound-url-policy";

test("private, documentation, multicast and reserved IPv4/IPv6 ranges are blocked", () => {
  for (const address of [
    "127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.1.1", "0.0.0.0",
    "192.0.2.10", "198.51.100.10", "203.0.113.10", "224.0.0.1", "::1", "fd00::1", "fe80::1", "ff02::1", "2001:db8::1",
  ]) assert.equal(isPrivateOrSpecialIp(address), true, address);
  assert.equal(isPrivateOrSpecialIp("8.8.8.8"), false);
  assert.equal(isPrivateOrSpecialIp("2606:4700:4700::1111"), false);
});

test("webhook validation requires HTTPS and rejects local/private DNS answers", async () => {
  await assert.rejects(() => validatePublicWebhookUrl("http://8.8.8.8/hook"), /must use HTTPS/);
  await assert.rejects(() => validatePublicWebhookUrl("https://localhost/hook"), /localhost/);
  await assert.rejects(
    () => validatePublicWebhookUrl("https://example.test/hook", async () => [{ address: "10.1.2.3", family: 4 }]),
    /private, loopback, link-local, documentation, multicast, or reserved/,
  );
});

test("webhook validation accepts an HTTPS hostname only when every DNS answer is public", async () => {
  const url = await validatePublicWebhookUrl("https://hooks.example.test/dropi", async () => [
    { address: "8.8.8.8", family: 4 },
    { address: "2606:4700:4700::1111", family: 6 },
  ]);
  assert.equal(url, "https://hooks.example.test/dropi");
});
