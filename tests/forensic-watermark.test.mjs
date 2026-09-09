import test from "node:test";
import assert from "node:assert/strict";
import { forensicViewerToken } from "../lib/forensic-watermark.ts";

test("forensic viewer token is opaque, stable and session-bound", () => {
  const previous = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY;
  process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY = "test-forensic-key";
  try {
    const input = { userId: "user-a", deviceSessionId: "device-a", authSessionId: "auth-a" };
    const token = forensicViewerToken(input);
    assert.match(token, /^[A-Z2-9]{6}$/);
    assert.equal(token, forensicViewerToken(input));
    assert.notEqual(token, forensicViewerToken({ ...input, deviceSessionId: "device-b" }));
    assert.notEqual(token, forensicViewerToken({ ...input, userId: "user-b" }));
  } finally {
    if (previous === undefined) delete process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY;
    else process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY = previous;
  }
});
