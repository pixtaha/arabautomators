import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { loadTsModule } from "./load-ts-module.mjs";

const origin = "https://arabautomators.com";
const fakeKey = "test-only-commerce-key";
const session = { user: { id: "auth-student-a", email: "Student_A@example.com" } };

async function call(options = {}) {
  const tables = {
    students: [{ id: "student-a", email: "student_a@example.com" }, { id: "student-b", email: "student_b@example.com" }],
    student_n8n_credentials: [{ student_id: "student-a", subdomain: "workspace-a" }, { student_id: "student-b", subdomain: "workspace-b" }],
    student_api_credentials: [
      { id: "1", student_subdomain: "workspace-a", service_name: "commerce-api-lab", credential_value: "old-key", issued_at: "2026-01-01" },
      { id: "2", student_subdomain: "workspace-a", service_name: "commerce-api-lab", credential_value: fakeKey, issued_at: "2026-02-01" },
      { id: "3", student_subdomain: "workspace-a", service_name: "openrouter", credential_value: "unrelated-key", issued_at: "2026-03-01" },
      { id: "4", student_subdomain: "workspace-b", service_name: "commerce-api-lab", credential_value: "other-student-key", issued_at: "2026-03-01" },
      { id: "5", student_subdomain: "workspace-a", service_name: "commerce-api-lab", credential_value: "undated-key", issued_at: null },
    ],
    ...options.tables,
  };
  const queries = [];
  let sessionChecks = 0;
  const route = await loadTsModule("app/api/api-lab/credential/route.ts", {
    "@/lib/siteUrl": { SITE_URL: origin },
    "@/lib/auth/device-session": { getActiveDeviceSession: async () => {
      sessionChecks++;
      if (options.authError) throw options.authError;
      return "session" in options ? options.session : session;
    } },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from(table) {
      const query = { table, columns: null, filters: [], orders: [], limit: Infinity };
      queries.push(query);
      return {
        select(columns) { query.columns = columns; return this; },
        eq(column, value) { query.filters.push({ column, value }); return this; },
        ilike(column, value) { query.filters.push({ column, value, insensitive: true }); return this; },
        order(column, opts) { query.orders.push({ column, ...opts }); return this; },
        limit(value) { query.limit = value; return this; },
        async maybeSingle() {
          if (options.failTable === table) return { error: { code: "PGRST116", message: `private detail ${fakeKey}`, details: fakeKey } };
          let rows = tables[table].filter((row) => query.filters.every(({ column, value, insensitive }) =>
            insensitive ? row[column].toLowerCase() === value.replace(/\\([\\%_])/g, "$1").toLowerCase() : row[column] === value));
          rows.sort((a, b) => {
            for (const { column, ascending, nullsFirst } of query.orders) {
              if (a[column] === b[column]) continue;
              if (a[column] == null) return nullsFirst ? -1 : 1;
              if (b[column] == null) return nullsFirst ? 1 : -1;
              return (a[column] < b[column] ? -1 : 1) * (ascending ? 1 : -1);
            }
            return 0;
          });
          rows = rows.slice(0, query.limit);
          if (rows.length > 1) return { error: { code: "PGRST116" } };
          return { data: rows[0] ? Object.fromEntries(query.columns.split(/,\s*/).map((column) => [column, rows[0][column]])) : null };
        },
      };
    } }) },
  });
  const request = new Request(`${origin}/api/api-lab/credential${options.query ?? ""}`, {
    method: "POST", headers: { origin, ...options.headers }, body: options.body,
  });
  const response = await route.POST(request);
  assert.match(response.headers.get("Cache-Control"), /private, no-store/);
  assert.equal(response.headers.get("Vary"), "Cookie");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  return { response, body: await response.json(), queries, sessionChecks };
}

test("a verified student receives only their newest Commerce credential, ignoring browser identity/service input", async () => {
  const { response, body, queries } = await call({
    query: "?student_subdomain=workspace-b&service_name=openrouter",
    body: JSON.stringify({ student_subdomain: "workspace-b", student_id: "student-b", service_name: "openrouter" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(body, { credential: fakeKey });
  assert.deepEqual(queries.map((query) => query.columns), ["id, email", "subdomain", "credential_value"]);
  assert.equal(queries[0].filters[0].value, "student\\_a@example.com");
});

test("missing or revoked device sessions never query student data", async () => {
  const result = await call({ session: null });
  assert.equal(result.response.status, 401);
  assert.deepEqual(result.queries, []);
});

test("cross-site and mismatched-origin requests are rejected before authentication", async () => {
  for (const headers of [{ origin: "https://other.example" }, { "sec-fetch-site": "cross-site" }]) {
    const result = await call({ headers });
    assert.equal(result.response.status, 403);
    assert.equal(result.sessionChecks, 0);
    assert.deepEqual(result.queries, []);
  }
});

test("missing verified email and unregistered students cannot read credentials", async () => {
  for (const email of [undefined, "unknown@example.com", "student_%@example.com"]) {
    const result = await call({ session: { user: { email } } });
    assert.equal(result.response.status, 403);
    assert.ok(result.queries.every((query) => query.table === "students"));
  }
});

test("missing workspace or Commerce credential returns only null", async () => {
  for (const table of ["student_n8n_credentials", "student_api_credentials"]) {
    const result = await call({ tables: { [table]: [] } });
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.body, { credential: null });
  }
});

test("duplicate credentials use the newest date, with descending id as a stable tie-breaker", async () => {
  const base = { student_subdomain: "workspace-a", service_name: "commerce-api-lab", issued_at: "2026-02-01" };
  const rows = [
    { ...base, id: "a", credential_value: "tie-a" },
    { ...base, id: "b", credential_value: "tie-b" },
    { ...base, id: "z", issued_at: null, credential_value: "undated" },
  ];
  for (const values of [rows, [...rows].reverse()]) {
    const result = await call({ tables: { student_api_credentials: values } });
    assert.deepEqual(result.body, { credential: "tie-b" });
  }
});

test("ambiguous student/workspace mappings fail closed, with no credential query", async () => {
  const log = mock.method(console, "error", () => {});
  try {
    for (const [table, row] of [
      ["students", { id: "duplicate", email: "student_a@example.com" }],
      ["student_n8n_credentials", { student_id: "student-a", subdomain: "duplicate" }],
    ]) {
      const result = await call({ tables: { [table]: [row, row] } });
      assert.equal(result.response.status, 503);
      assert.ok(result.queries.every((query) => query.table !== "student_api_credentials"));
    }
  } finally { log.mock.restore(); }
});

test("auth/database failures return generic errors and log only safe diagnostics", async () => {
  const log = mock.method(console, "error", () => {});
  try {
    for (const options of [
      { authError: new Error(fakeKey) },
      ...["students", "student_n8n_credentials", "student_api_credentials"].map((failTable) => ({ failTable })),
    ]) {
      const result = await call(options);
      assert.equal(result.response.status, 503);
      assert.deepEqual(result.body, { error: "Your credential is temporarily unavailable. Please try again." });
    }
    assert.equal(log.mock.calls.length, 4);
    assert.ok(log.mock.calls.every((call) => !JSON.stringify(call.arguments).includes(fakeKey)));
  } finally { log.mock.restore(); }
});
