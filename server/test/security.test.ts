import assert from "node:assert/strict";
import test from "node:test";
import { hashAccessToken, hashPassword, verifyPassword } from "../src/security.js";

test("password hashes are salted and verifiable", async () => {
	const first = await hashPassword("correct horse battery staple");
	const second = await hashPassword("correct horse battery staple");
	assert.notEqual(first, second);
	assert.equal(await verifyPassword("correct horse battery staple", first), true);
	assert.equal(await verifyPassword("wrong password", first), false);
});

test("access tokens are stored as one-way hashes", () => {
	assert.equal(hashAccessToken("session-token").length, 64);
	assert.notEqual(hashAccessToken("session-token"), "session-token");
});
