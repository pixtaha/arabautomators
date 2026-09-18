-- Applied manually via docker exec on supabase-db, same as every other
-- migration in this project. Run once, after
-- 20260918_create_api_lab_docs_schema.sql -- there is no unique constraint
-- guarding blocks/endpoints against double-insertion, so re-running this
-- file would duplicate rows.
--
-- Seeds the 9 sections, their content blocks, and the endpoint reference
-- table, migrated 1:1 from app/dashboard/api-lab-docs/fragment.ts's current
-- content so the v2 page starts with the same documentation, just
-- structured as data instead of a hardcoded HTML string. Inline rich text
-- uses the markdown-lite convention documented in the schema migration
-- (`code`, **bold**, [text](url)) -- no raw HTML anywhere in this file.

insert into public.api_lab_doc_sections (slug, nav_label, title, eyebrow, display_order) values
  ('start',      'Getting started',        'Getting started',                    null,          10),
  ('endpoints',  'Endpoint reference',     'Endpoint reference',                 null,          20),
  ('params',     'Query parameters',       'Query parameters versus path parameters', null,     30),
  ('response',   'Response structure',     'Response structure',                 null,          40),
  ('orders',     'Write an order',         'Write an order',                     null,          50),
  ('errors',     'Headers & errors',       'Headers and error exercises',        null,          60),
  ('http-node',  'n8n: HTTP Request',      'HTTP Request',                       'n8n lesson',   70),
  ('webhooks',   'n8n: receive webhooks',  'Receive webhooks',                   'n8n lesson',   80),
  ('exercises',  'Suggested exercises',    'Suggested exercises',                null,           90);

insert into public.api_lab_doc_blocks (section_id, display_order, kind, content)
select
  (select id from public.api_lab_doc_sections where slug = t.section_slug),
  t.display_order,
  t.kind,
  t.content
from jsonb_to_recordset($blocks$
[
  {"section_slug":"start","display_order":10,"kind":"numbered_steps","content":{"steps":[
    "GET `/health`: expect 200 and `status: ok`.",
    "GET `/v1/hello?name=Automator`: inspect the greeting and request ID.",
    "GET `/v1/products?limit=5`: the array is in `data`, and pagination is in `meta`.",
    "In Swagger, click Authorize and enter your instructor-issued **training key**.",
    "In n8n, create a Header Auth credential with name `X-API-Key` and the same value. Keep it in credentials, not in workflow fields or URLs.",
    "GET `/v1/private/profile`: expect your anonymous workspace and permissions."
  ]}},

  {"section_slug":"endpoints","display_order":10,"kind":"paragraph","content":{"text":"All paths below are relative to the base URL. “Key” means send `X-API-Key`."}},
  {"section_slug":"endpoints","display_order":20,"kind":"endpoint_table","content":{}},
  {"section_slug":"endpoints","display_order":30,"kind":"callout","content":{"accent":"brand","text":"Categories, brands and sellers accept `search`, `page`, `limit`. Review sort: `id`, `-id`, `rating`, `-rating`. Orders sort: `id`, `-id`, `total`, `-total`, `created_at`, `-created_at`; `scope=mine` selects just your orders; `scope=seed` selects read-only examples. Order lists omit item details (`items: null`); GET an individual order for its lines."}},

  {"section_slug":"params","display_order":10,"kind":"paragraph","content":{"text":"In `/v1/products/123`, **123** is a path parameter selecting one resource. In `/v1/products?category=electronics&limit=10`, the query parameters filter and page the collection. Put the `?` only once, and separate parameters with `&`. n8n's query parameter fields encode them for you."}},
  {"section_slug":"params","display_order":20,"kind":"table","content":{
    "columns":[{"key":"query","label":"Product query"},{"key":"example","label":"Example"},{"key":"meaning","label":"Meaning"}],
    "rows":[
      {"query":"category","example":"`electronics`","meaning":"Category slug, exact name or ID"},
      {"query":"brand","example":"`aster-tech`","meaning":"Brand slug, exact name or ID; browse `/v1/brands`"},
      {"query":"seller_id","example":"`10`","meaning":"A seller ID"},
      {"query":"min_price, max_price","example":"`10`, `150`","meaning":"Inclusive USD prices"},
      {"query":"min_rating","example":"`4`","meaning":"Minimum rating, 0–5"},
      {"query":"in_stock","example":"`true`","meaning":"Stock above zero; false means out of stock"},
      {"query":"free_shipping","example":"`true`","meaning":"Products eligible for free shipping"},
      {"query":"search","example":"`keyboard`","meaning":"Case-insensitive substring of name/SKU/description"},
      {"query":"sort","example":"`-price`","meaning":"Descending price; no minus means ascending"},
      {"query":"page","example":"`1`","meaning":"First page is 1"},
      {"query":"limit","example":"`20`","meaning":"Page size 1–100, default 20"}
    ]
  }},
  {"section_slug":"params","display_order":30,"kind":"paragraph","content":{"text":"Product sort options: `id`, `price`, `-price`, `rating`, `-rating`, `name`, `-name`, `created_at`, `-created_at`. Equal values use an ID tie-breaker. An unknown sort or invalid range returns 422."}},
  {"section_slug":"params","display_order":40,"kind":"code","content":{"language":"bash","code":"curl 'https://api-lab.arabautomators.com/v1/products?category=computers&in_stock=true&min_price=20&max_price=500&sort=price&page=1&limit=10'\ncurl 'https://api-lab.arabautomators.com/v1/products?search=keyboard&sort=-rating&limit=5'"}},

  {"section_slug":"response","display_order":10,"kind":"code","content":{"language":"json","code":"{\n  \"success\": true,\n  \"data\": [],\n  \"meta\": {\"request_id\": \"example-request\", \"page\": 1, \"limit\": 20, \"total\": 50000, \"total_pages\": 2500, \"has_next\": true, \"has_previous\": false},\n  \"links\": {\"self\": \"https://api-lab.arabautomators.com/v1/products?page=1&limit=20\", \"next\": \"https://api-lab.arabautomators.com/v1/products?page=2&limit=20\", \"previous\": null}\n}"}},
  {"section_slug":"response","display_order":20,"kind":"paragraph","content":{"text":"The empty array above illustrates the envelope; real pages contain records. Single-resource responses have `data` as one object and `meta.request_id`. An empty search has `total: 0`, `total_pages: 0`, and `data: []`. Always stop pagination when `has_next` is false. The catalog starts with 50,000 products, 8,000 customers and 25,000 read-only orders."}},

  {"section_slug":"orders","display_order":10,"kind":"paragraph","content":{"text":"Send POST `/v1/orders` with your key, `Content-Type: application/json`, and optionally `Idempotency-Key: exercise-001`:"}},
  {"section_slug":"orders","display_order":20,"kind":"code","content":{"language":"json","code":"{\"customer_id\":1,\"items\":[{\"product_id\":1,\"quantity\":2},{\"product_id\":2,\"quantity\":1}],\"notes\":\"Generated practice order\"}"}},
  {"section_slug":"orders","display_order":30,"kind":"paragraph","content":{"text":"Use an in-stock product ID. Each order allows 1–20 distinct products and 1–20 units per product. Price and totals come from the server. Money is USD with two decimal places; shipping is zero for orders of at least $100 or when every item has free shipping, otherwise $5.99. No tax or real payment is charged. Save `data.id` from the 201 response. With the same idempotency key and body, a retry returns the same order with 200; changing the body while reusing that key returns 409. Replays return the order's current state."}},
  {"section_slug":"orders","display_order":40,"kind":"paragraph","content":{"text":"Use your saved ID in these requests:"}},
  {"section_slug":"orders","display_order":50,"kind":"code","content":{"language":"text","code":"PATCH  /v1/orders/{id}          {\"notes\":\"Prepared for fulfillment\"}\nPOST   /v1/orders/{id}/pay      (no body)\nPOST   /v1/orders/{id}/ship     (no body)\nGET    /v1/orders/{id}         (read data.tracking_number)\nGET    /v1/shipments/{tracking_number}\nPOST   /v1/orders/{id}/deliver (no body)"}},
  {"section_slug":"orders","display_order":60,"kind":"badge_sequence","content":{"label":"Lifecycle","badges":["pending","paid","shipped","delivered"]}},
  {"section_slug":"orders","display_order":70,"kind":"paragraph","content":{"text":"Repeating an action already in its target state is safe and creates no duplicate event. Invalid transitions return 409. To cancel a pending or paid order, PATCH `{\"status\":\"cancelled\"}`; stock is returned once. To practice DELETE, use a pending or already cancelled order. A pending deletion also emits `order.cancelled`; 204 has no JSON body. Shipped and delivered orders cannot be cancelled/deleted. Other keys cannot see or modify your created orders. Shared seed orders cannot be modified."}},

  {"section_slug":"errors","display_order":10,"kind":"paragraph","content":{"text":"Send `X-Request-ID: lesson-001` to correlate responses. The inspector shows custom headers and query parameters. Credential-like field names are redacted, but it is still a training tool: send fake values only."}},
  {"section_slug":"errors","display_order":20,"kind":"code","content":{"language":"json","code":"{\"success\":false,\"error\":{\"code\":409,\"message\":\"Cannot move an order from pending to shipped.\",\"details\":null},\"meta\":{\"request_id\":\"lesson-001\"}}"}},
  {"section_slug":"errors","display_order":30,"kind":"table","content":{
    "columns":[{"key":"status","label":"Status"},{"key":"exercise","label":"Exercise"}],
    "rows":[
      {"status":"200","exercise":"Read a product or update an order"},
      {"status":"201","exercise":"Create an order or webhook"},
      {"status":"204","exercise":"Delete a pending order/subscription; do not parse a body"},
      {"status":"400","exercise":"GET `/v1/errors/400`"},
      {"status":"401","exercise":"Call `/v1/private/profile` without a key"},
      {"status":"403","exercise":"GET `/v1/errors/403`"},
      {"status":"404","exercise":"Request a nonexistent product"},
      {"status":"409","exercise":"Ship before paying or modify a seed order"},
      {"status":"413","exercise":"Body exceeds 64 KiB"},
      {"status":"422","exercise":"Use `limit=101`, a negative quantity or an unknown sort"},
      {"status":"429","exercise":"Call rate-limit-demo six times in 60 seconds"},
      {"status":"500 / 502 / 503 / 504","exercise":"GET `/v1/errors/{code}` for retry/branching practice"}
    ]
  }},
  {"section_slug":"errors","display_order":40,"kind":"callout","content":{"accent":"accent","text":"The sixth demo request returns `Retry-After`; wait that number of seconds before retrying. Normal API limits are separate: 120 requests/minute per key (or anonymous IP), with a 600/minute IP safeguard. Treat the rate-limit headers as the available request budget. Edge-level body/concurrency rejections can have Traefik's response format."}},

  {"section_slug":"http-node","display_order":10,"kind":"paragraph","content":{"text":"Set Method GET, URL `https://api-lab.arabautomators.com/v1/products`, query `category=electronics`, `limit=10`, `sort=price`, response JSON. Split the output `data` array to process products. For authenticated calls select Generic Credential Type → Header Auth and your saved credential. For POST use Send Body → JSON and the order body above. Keep SSL verification enabled."}},
  {"section_slug":"http-node","display_order":20,"kind":"paragraph","content":{"text":"For a short pagination exercise, follow `{{ $response.body.links.next }}` and stop on `{{ !$response.body.meta.has_next }}`; set a one-second interval and a small page cap. For error lessons, Include Response Headers and Status and Never Error expose `statusCode` for an IF/Switch node. Honor `Retry-After` with a Wait node. See [n8n HTTP Request documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)."}},

  {"section_slug":"webhooks","display_order":10,"kind":"paragraph","content":{"text":"Create a Webhook node using **POST**, a unique path `commerce-lab-001`, and an immediate response. Publish/activate the workflow and copy its production URL. Test URLs work only while a test execution listens. See [n8n Webhook documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)."}},
  {"section_slug":"webhooks","display_order":20,"kind":"paragraph","content":{"text":"POST `/v1/webhooks` with your API key:"}},
  {"section_slug":"webhooks","display_order":30,"kind":"code","content":{"language":"json","code":"{\"url\":\"https://your-instance.arabautomators.com/webhook/commerce-lab-001\",\"events\":[\"order.created\",\"order.paid\",\"order.shipped\",\"order.delivered\",\"order.cancelled\"]}"}},
  {"section_slug":"webhooks","display_order":40,"kind":"paragraph","content":{"text":"Store the returned `id` and one-time `signing_secret` securely. Trigger an event by creating/updating an order under the same key. The receiver gets:"}},
  {"section_slug":"webhooks","display_order":50,"kind":"code","content":{"language":"json","code":"{\"id\":\"evt_example\",\"type\":\"order.created\",\"api_version\":\"1.0\",\"created_at\":\"2026-09-11T12:00:00Z\",\"livemode\":false,\"data\":{\"order\":{\"id\":25001,\"customer_id\":1,\"status\":\"pending\",\"currency\":\"USD\",\"total\":79.98}}}"}},
  {"section_slug":"webhooks","display_order":60,"kind":"paragraph","content":{"text":"This abbreviated example omits the full order items, notes, timestamps and shipping fields. In n8n use `$json.body.type`, `$json.body.id` and `$json.body.data.order.id`. Use a Switch node to branch by event type. List `/v1/webhooks/{id}/deliveries` to diagnose results. The receiver must return 2xx; 404 usually means the workflow is inactive or the path/method is wrong."}},
  {"section_slug":"webhooks","display_order":70,"kind":"paragraph","content":{"text":"Each event has a stable ID; deduplicate it because retries can deliver an event again. Five attempts maximum, with increasing delays; events may arrive out of order during retries. No API key is sent to the receiver. HMAC verification uses `X-Webhook-Signature` and `X-Webhook-Timestamp`: calculate hex HMAC-SHA256 over `timestamp + \".\" + raw_body`, using the signing secret, and compare to the signature after the `sha256=` prefix. Verify the timestamp is recent. Use the original bytes, not re-serialized JSON. Full verification details are in the operator README."}},
  {"section_slug":"webhooks","display_order":80,"kind":"callout","content":{"accent":"brand","text":"Targets must be HTTPS public subdomains of `arabautomators.com`, port 443, with a `/webhook/…` or `/webhook-test/…` path; no URL credentials, query or fragment. Private IP addresses and redirects are blocked. Subscriptions belong to one key and never receive other workspaces' events. Delete the subscription when an exercise is finished."}},

  {"section_slug":"exercises","display_order":10,"kind":"ordered_list","content":{"items":[
    "Compare path parameters, query parameters and request headers with products and the inspector.",
    "Find five in-stock computer products costing under $500, sorted by rating.",
    "Join product category, brand and seller IDs to the corresponding list endpoints.",
    "Page through customers from one country using fake `example.test` emails.",
    "Create an order, replay it with an idempotency key, and confirm one order ID.",
    "Route an order through paid, shipped and delivered; inspect its shipment.",
    "Receive all five webhook events and route them with a Switch node.",
    "Handle 401, 409, 422, 429 and simulated 503 responses."
  ]}},
  {"section_slug":"exercises","display_order":20,"kind":"callout","content":{"accent":"ink","text":"Ask the instructor to reset your anonymous workspace when necessary; a reset removes its training writes and subscriptions. A complete lab reseed also invalidates learner keys and requires new credentials."}}
]
$blocks$) as t(section_slug text, display_order integer, kind text, content jsonb);

insert into public.api_lab_endpoints (section_id, method, path, requires_key, is_write, purpose, display_order)
select
  (select id from public.api_lab_doc_sections where slug = 'endpoints'),
  t.method, t.path, t.requires_key, t.is_write, t.purpose, t.display_order
from jsonb_to_recordset($endpoints$
[
  {"method":"GET","path":"/health","requires_key":false,"is_write":false,"purpose":"Service/database/worker status, 200","display_order":10},
  {"method":"GET","path":"/v1/hello","requires_key":false,"is_write":false,"purpose":"`name` query parameter, 200","display_order":20},
  {"method":"GET","path":"/v1/products","requires_key":false,"is_write":false,"purpose":"Filter/search/sort/paginate products, 200","display_order":30},
  {"method":"GET","path":"/v1/products/{product_id}","requires_key":false,"is_write":false,"purpose":"Product details, 200","display_order":40},
  {"method":"GET","path":"/v1/products/{product_id}/reviews","requires_key":false,"is_write":false,"purpose":"Reviews with `min_rating`, `sort`, `page`, `limit`, 200","display_order":50},
  {"method":"GET","path":"/v1/categories","requires_key":false,"is_write":false,"purpose":"Category names, slugs and IDs, 200","display_order":60},
  {"method":"GET","path":"/v1/brands","requires_key":false,"is_write":false,"purpose":"Fictional brands, 200","display_order":70},
  {"method":"GET","path":"/v1/sellers","requires_key":false,"is_write":false,"purpose":"Generated sellers and ratings, 200","display_order":80},
  {"method":"GET","path":"/v1/customers","requires_key":true,"is_write":false,"purpose":"Generated customers; `country`, `search`, `page`, `limit`, 200","display_order":90},
  {"method":"GET","path":"/v1/customers/{customer_id}","requires_key":true,"is_write":false,"purpose":"Generated customer detail, 200","display_order":100},
  {"method":"GET","path":"/v1/orders","requires_key":true,"is_write":false,"purpose":"Seed + your orders; `status`, `customer_id`, `scope`, `sort`, paging, 200","display_order":110},
  {"method":"GET","path":"/v1/orders/{order_id}","requires_key":true,"is_write":false,"purpose":"Order with items and tracking, 200","display_order":120},
  {"method":"POST","path":"/v1/orders","requires_key":true,"is_write":true,"purpose":"Create and reserve stock, 201","display_order":130},
  {"method":"PATCH","path":"/v1/orders/{order_id}","requires_key":true,"is_write":true,"purpose":"Edit notes or cancel, 200","display_order":140},
  {"method":"DELETE","path":"/v1/orders/{order_id}","requires_key":true,"is_write":true,"purpose":"Delete pending/cancelled order, 204 with no body","display_order":150},
  {"method":"POST","path":"/v1/orders/{order_id}/pay","requires_key":true,"is_write":true,"purpose":"Simulate payment, 200","display_order":160},
  {"method":"POST","path":"/v1/orders/{order_id}/ship","requires_key":true,"is_write":true,"purpose":"Create simulated shipment, 200","display_order":170},
  {"method":"POST","path":"/v1/orders/{order_id}/deliver","requires_key":true,"is_write":true,"purpose":"Mark delivered, 200","display_order":180},
  {"method":"GET","path":"/v1/shipments/{tracking_number}","requires_key":true,"is_write":false,"purpose":"Shipment tracking, 200","display_order":190},
  {"method":"GET","path":"/v1/request-inspector","requires_key":false,"is_write":false,"purpose":"Inspect path, query, headers; secret fields redacted, 200","display_order":200},
  {"method":"POST","path":"/v1/echo","requires_key":false,"is_write":true,"purpose":"Echo a JSON object with secret fields redacted, 200","display_order":210},
  {"method":"GET","path":"/v1/private/profile","requires_key":true,"is_write":false,"purpose":"Authentication exercise, 200","display_order":220},
  {"method":"GET","path":"/v1/rate-limit-demo","requires_key":true,"is_write":false,"purpose":"5 accepted requests/minute, then 429","display_order":230},
  {"method":"GET","path":"/v1/errors/{code}","requires_key":false,"is_write":false,"purpose":"Deliberate HTTP error; see codes below","display_order":240},
  {"method":"POST","path":"/v1/webhooks","requires_key":true,"is_write":true,"purpose":"Register receiver, 201; signing secret shown once","display_order":250},
  {"method":"GET","path":"/v1/webhooks","requires_key":true,"is_write":false,"purpose":"List your active subscriptions, 200","display_order":260},
  {"method":"GET","path":"/v1/webhooks/{webhook_id}","requires_key":true,"is_write":false,"purpose":"Subscription details without its secret, 200","display_order":270},
  {"method":"DELETE","path":"/v1/webhooks/{webhook_id}","requires_key":true,"is_write":true,"purpose":"Disable subscription, 204","display_order":280},
  {"method":"GET","path":"/v1/webhooks/{webhook_id}/deliveries","requires_key":true,"is_write":false,"purpose":"Delivery status and retries, 200","display_order":290}
]
$endpoints$) as t(method text, path text, requires_key boolean, is_write boolean, purpose text, display_order integer);
