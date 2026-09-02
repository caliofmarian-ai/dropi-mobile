import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORITY_REPORT_DISCLAIMER,
  AUTHORITY_REPORT_TARGETS,
  authorityTemplate,
  csvCell,
} from "../shared/authority-report-policy";

test("authority targets are exactly the canonical roadmap targets", () => {
  assert.deepEqual(AUTHORITY_REPORT_TARGETS, ["CAAP", "EASA", "FAA"]);
});

test("authority pack cannot masquerade as an official filing form", () => {
  assert.match(AUTHORITY_REPORT_DISCLAIMER, /not an official/i);
  for (const target of AUTHORITY_REPORT_TARGETS) {
    assert.equal(authorityTemplate(target).target, target);
  }
});

test("authority CSV escapes embedded quotes", () => {
  assert.equal(csvCell('a "quoted" value'), '"a ""quoted"" value"');
});
