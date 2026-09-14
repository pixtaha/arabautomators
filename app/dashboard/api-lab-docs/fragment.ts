// The Commerce API reference content, imported verbatim from the "Student
// API Documentation" Claude Design project, minus the <helmet> block (its
// <link>/<script src> children now load via reference.css + next/script in
// ApiLabDocsClient.tsx instead). Mounted with dangerouslySetInnerHTML because
// support.js's boot() looks for a literal <x-dc> element and a sibling
// <script data-dc-script> in the DOM and replaces/renders them itself --
// this can't be expressed as ordinary JSX.
//
// Changes from the source, beyond dropping <helmet>:
// - Each <section data-sec="..."> gained class="reveal-row" and a staggered
//   animation-delay (reusing app/globals.css's existing aa-reveal keyframe)
//   so sections fade/slide in instead of popping in instantly once the DC
//   runtime un-hides the template.
// - The three info-box <div>s gained class="lab-infobox" for a hover lift.
// - The Base URL box's value moved into a <code> inside a [data-block], with
//   a small icon <button data-copy> next to it, reusing the exact copy/paste
//   DOM contract the code blocks below already use -- only Base URL got this
//   (the other two are links you'd click through, not values you'd copy).
// - The embedded <script data-dc-script> component's copy handler gained one
//   branch so it can toggle an icon button's "copied" state (a class swap)
//   instead of always overwriting textContent, which would have wiped out
//   the SVG icons on the icon button.
export const COMMERCE_API_REFERENCE_HTML = `<x-dc>

<div style="min-height:100vh;background:var(--surface-page);font:var(--type-body);color:var(--text-body)">

  <x-import component-from-global-scope="ArabAutomatorsDesignSystem_f5d5e6.DotField" from="/api-lab-docs/_ds/arab-automators-design-system-f5d5e6cd-069e-4c1c-91b7-6cf2a79a141a/_ds_bundle.js" tone="paper" fade="bottom" radius="0" hint-size="100%,300px">
    <div style="background:var(--bg-dots)"><div style="max-width:1180px;margin:0 auto;padding:var(--hero-pad)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
        <span style="width:8px;height:8px;border-radius:999px;background:var(--surface-brand)"></span>
        <span style="font:var(--type-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)">Arab Automators · student reference</span>
      </div>
      <h1 style="font-family:var(--font-display);font-weight:800;font-size:var(--hero-fs);line-height:1.02;letter-spacing:var(--tr-tightest);color:var(--text-strong);margin-bottom:20px">Commerce API</h1>
      <p style="max-width:68ch;font:var(--fw-regular) var(--fs-lg)/1.6 var(--font-body);color:var(--text-body);text-wrap:pretty">Build n8n workflows against a fictional e-commerce company. All customers, products, orders, reviews and shipments are generated. Payments are simulated. Use only fake exercise data; never submit real payment details, personal information, or production credentials.</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:28px">
        <div class="lab-infobox" style="display:flex;flex-direction:column;gap:4px;padding:12px 16px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:12px;box-shadow:var(--shadow-sm)">
          <span style="font:var(--type-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)">Base URL</span>
          <div data-block style="display:flex;align-items:center;gap:6px">
            <code style="background:none;padding:0;font:var(--fw-bold) 13px/1.4 var(--font-mono);color:var(--aa-black)">https://api-lab.arabautomators.com</code>
            <button data-copy type="button" class="lab-copy-btn" aria-label="Copy base URL" title="Copy base URL">
              <svg class="lab-copy-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"></path></svg>
              <svg class="lab-copied-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
        </div>
        <div class="lab-infobox" style="display:flex;flex-direction:column;gap:4px;padding:12px 16px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:12px;box-shadow:var(--shadow-sm)">
          <span style="font:var(--type-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)">Interactive explorer</span>
          <a href="https://api-lab.arabautomators.com/docs" style="font:var(--fw-bold) 13px/1.4 var(--font-mono)">/docs</a>
        </div>
        <div class="lab-infobox" style="display:flex;flex-direction:column;gap:4px;padding:12px 16px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:12px;box-shadow:var(--shadow-sm)">
          <span style="font:var(--type-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)">OpenAPI</span>
          <a href="https://api-lab.arabautomators.com/openapi.json" style="font:var(--fw-bold) 13px/1.4 var(--font-mono)">/openapi.json</a>
        </div>
      </div>
    </div></div>
  </x-import>

  <div style="display:grid;grid-template-columns:var(--doc-cols);gap:var(--doc-gap);max-width:1180px;margin:0 auto;padding:var(--body-pad);align-items:start">

    <nav id="doc-nav" style="position:var(--nav-sticky);top:var(--nav-top);z-index:20;padding:var(--nav-pad);background:var(--nav-bg);border-bottom:var(--nav-line)">
      <div style="display:flex;flex-direction:var(--nav-dir);gap:2px;overflow-x:var(--nav-ovf);scrollbar-width:thin">
        <a href="#start" data-nav="start" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">Getting started</a>
        <a href="#endpoints" data-nav="endpoints" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">Endpoint reference</a>
        <a href="#params" data-nav="params" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">Query parameters</a>
        <a href="#response" data-nav="response" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">Response structure</a>
        <a href="#orders" data-nav="orders" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">Write an order</a>
        <a href="#errors" data-nav="errors" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">Headers &amp; errors</a>
        <a href="#http-node" data-nav="http-node" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">n8n: HTTP Request</a>
        <a href="#webhooks" data-nav="webhooks" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">n8n: receive webhooks</a>
        <a href="#exercises" data-nav="exercises" style="flex:none;padding:7px 11px;border-radius:999px;font:var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body);color:var(--text-muted);text-decoration:none;white-space:nowrap;transition:background 140ms var(--ease-smooth),color 140ms var(--ease-smooth)">Suggested exercises</a>
      </div>
    </nav>

    <main style="max-width:860px;min-width:0;display:flex;flex-direction:column;gap:64px">

      <section id="start" data-sec="start" class="reveal-row" style="scroll-margin-top:80px;animation-delay:0ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:20px">Getting started</h2>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;gap:14px;padding:16px 20px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm)">
            <span style="flex:none;font:var(--fw-bold) 13px/1.6 var(--font-mono);color:var(--aa-green-700)">01</span>
            <p>GET <code>/health</code>: expect 200 and <code>status: ok</code>.</p>
          </div>
          <div style="display:flex;gap:14px;padding:16px 20px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm)">
            <span style="flex:none;font:var(--fw-bold) 13px/1.6 var(--font-mono);color:var(--aa-green-700)">02</span>
            <p>GET <code>/v1/hello?name=Automator</code>: inspect the greeting and request ID.</p>
          </div>
          <div style="display:flex;gap:14px;padding:16px 20px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm)">
            <span style="flex:none;font:var(--fw-bold) 13px/1.6 var(--font-mono);color:var(--aa-green-700)">03</span>
            <p>GET <code>/v1/products?limit=5</code>: the array is in <code>data</code>, and pagination is in <code>meta</code>.</p>
          </div>
          <div style="display:flex;gap:14px;padding:16px 20px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm)">
            <span style="flex:none;font:var(--fw-bold) 13px/1.6 var(--font-mono);color:var(--aa-green-700)">04</span>
            <p>In Swagger, click Authorize and enter your instructor-issued <strong>training key</strong>.</p>
          </div>
          <div style="display:flex;gap:14px;padding:16px 20px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm)">
            <span style="flex:none;font:var(--fw-bold) 13px/1.6 var(--font-mono);color:var(--aa-green-700)">05</span>
            <p>In n8n, create a Header Auth credential with name <code>X-API-Key</code> and the same value. Keep it in credentials, not in workflow fields or URLs.</p>
          </div>
          <div style="display:flex;gap:14px;padding:16px 20px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm)">
            <span style="flex:none;font:var(--fw-bold) 13px/1.6 var(--font-mono);color:var(--aa-green-700)">06</span>
            <p>GET <code>/v1/private/profile</code>: expect your anonymous workspace and permissions.</p>
          </div>
        </div>
      </section>

      <section id="endpoints" data-sec="endpoints" class="reveal-row" style="scroll-margin-top:80px;animation-delay:60ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:12px">Endpoint reference</h2>
        <p style="max-width:68ch;margin-bottom:20px">All paths below are relative to the base URL. “Key” means send <code>X-API-Key</code>.</p>
        <div style="background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden">
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Method</th><th>Path</th><th>Key</th><th>Purpose / successful status</th></tr></thead>
              <tbody>
                <tr><td>GET</td><td><code>/health</code></td><td data-y="n">No</td><td>Service/database/worker status, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/hello</code></td><td data-y="n">No</td><td><code>name</code> query parameter, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/products</code></td><td data-y="n">No</td><td>Filter/search/sort/paginate products, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/products/{product_id}</code></td><td data-y="n">No</td><td>Product details, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/products/{product_id}/reviews</code></td><td data-y="n">No</td><td>Reviews with <code>min_rating</code>, <code>sort</code>, <code>page</code>, <code>limit</code>, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/categories</code></td><td data-y="n">No</td><td>Category names, slugs and IDs, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/brands</code></td><td data-y="n">No</td><td>Fictional brands, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/sellers</code></td><td data-y="n">No</td><td>Generated sellers and ratings, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/customers</code></td><td data-y="y">Yes</td><td>Generated customers; <code>country</code>, <code>search</code>, <code>page</code>, <code>limit</code>, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/customers/{customer_id}</code></td><td data-y="y">Yes</td><td>Generated customer detail, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/orders</code></td><td data-y="y">Yes</td><td>Seed + your orders; <code>status</code>, <code>customer_id</code>, <code>scope</code>, <code>sort</code>, paging, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/orders/{order_id}</code></td><td data-y="y">Yes</td><td>Order with items and tracking, 200</td></tr>
                <tr><td data-write>POST</td><td><code>/v1/orders</code></td><td data-y="y">Yes</td><td>Create and reserve stock, 201</td></tr>
                <tr><td data-write>PATCH</td><td><code>/v1/orders/{order_id}</code></td><td data-y="y">Yes</td><td>Edit notes or cancel, 200</td></tr>
                <tr><td data-write>DELETE</td><td><code>/v1/orders/{order_id}</code></td><td data-y="y">Yes</td><td>Delete pending/cancelled order, 204 with no body</td></tr>
                <tr><td data-write>POST</td><td><code>/v1/orders/{order_id}/pay</code></td><td data-y="y">Yes</td><td>Simulate payment, 200</td></tr>
                <tr><td data-write>POST</td><td><code>/v1/orders/{order_id}/ship</code></td><td data-y="y">Yes</td><td>Create simulated shipment, 200</td></tr>
                <tr><td data-write>POST</td><td><code>/v1/orders/{order_id}/deliver</code></td><td data-y="y">Yes</td><td>Mark delivered, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/shipments/{tracking_number}</code></td><td data-y="y">Yes</td><td>Shipment tracking, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/request-inspector</code></td><td data-y="n">No</td><td>Inspect path, query, headers; secret fields redacted, 200</td></tr>
                <tr><td data-write>POST</td><td><code>/v1/echo</code></td><td data-y="n">No</td><td>Echo a JSON object with secret fields redacted, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/private/profile</code></td><td data-y="y">Yes</td><td>Authentication exercise, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/rate-limit-demo</code></td><td data-y="y">Yes</td><td>5 accepted requests/minute, then 429</td></tr>
                <tr><td>GET</td><td><code>/v1/errors/{code}</code></td><td data-y="n">No</td><td>Deliberate HTTP error; see codes below</td></tr>
                <tr><td data-write>POST</td><td><code>/v1/webhooks</code></td><td data-y="y">Yes</td><td>Register receiver, 201; signing secret shown once</td></tr>
                <tr><td>GET</td><td><code>/v1/webhooks</code></td><td data-y="y">Yes</td><td>List your active subscriptions, 200</td></tr>
                <tr><td>GET</td><td><code>/v1/webhooks/{webhook_id}</code></td><td data-y="y">Yes</td><td>Subscription details without its secret, 200</td></tr>
                <tr><td data-write>DELETE</td><td><code>/v1/webhooks/{webhook_id}</code></td><td data-y="y">Yes</td><td>Disable subscription, 204</td></tr>
                <tr><td>GET</td><td><code>/v1/webhooks/{webhook_id}/deliveries</code></td><td data-y="y">Yes</td><td>Delivery status and retries, 200</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style="display:flex;gap:0;margin-top:16px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm)">
          <div style="flex:none;width:4px;background:var(--surface-brand)"></div>
          <p style="padding:16px 20px;max-width:68ch">Categories, brands and sellers accept <code>search</code>, <code>page</code>, <code>limit</code>. Review sort: <code>id</code>, <code>-id</code>, <code>rating</code>, <code>-rating</code>. Orders sort: <code>id</code>, <code>-id</code>, <code>total</code>, <code>-total</code>, <code>created_at</code>, <code>-created_at</code>; <code>scope=mine</code> selects just your orders; <code>scope=seed</code> selects read-only examples. Order lists omit item details (<code>items: null</code>); GET an individual order for its lines.</p>
        </div>
      </section>

      <section id="params" data-sec="params" class="reveal-row" style="scroll-margin-top:80px;animation-delay:120ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:12px">Query parameters versus path parameters</h2>
        <p style="max-width:68ch;margin-bottom:20px">In <code>/v1/products/123</code>, <strong>123</strong> is a path parameter selecting one resource. In <code>/v1/products?category=electronics&amp;limit=10</code>, the query parameters filter and page the collection. Put the <code>?</code> only once, and separate parameters with <code>&amp;</code>. n8n's query parameter fields encode them for you.</p>
        <div style="background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden">
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Product query</th><th>Example</th><th>Meaning</th></tr></thead>
              <tbody>
                <tr><td>category</td><td><code>electronics</code></td><td>Category slug, exact name or ID</td></tr>
                <tr><td>brand</td><td><code>aster-tech</code></td><td>Brand slug, exact name or ID; browse <code>/v1/brands</code></td></tr>
                <tr><td>seller_id</td><td><code>10</code></td><td>A seller ID</td></tr>
                <tr><td>min_price, max_price</td><td><code>10</code>, <code>150</code></td><td>Inclusive USD prices</td></tr>
                <tr><td>min_rating</td><td><code>4</code></td><td>Minimum rating, 0–5</td></tr>
                <tr><td>in_stock</td><td><code>true</code></td><td>Stock above zero; false means out of stock</td></tr>
                <tr><td>free_shipping</td><td><code>true</code></td><td>Products eligible for free shipping</td></tr>
                <tr><td>search</td><td><code>keyboard</code></td><td>Case-insensitive substring of name/SKU/description</td></tr>
                <tr><td>sort</td><td><code>-price</code></td><td>Descending price; no minus means ascending</td></tr>
                <tr><td>page</td><td><code>1</code></td><td>First page is 1</td></tr>
                <tr><td>limit</td><td><code>20</code></td><td>Page size 1–100, default 20</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <p style="max-width:68ch;margin-top:20px">Product sort options: <code>id</code>, <code>price</code>, <code>-price</code>, <code>rating</code>, <code>-rating</code>, <code>name</code>, <code>-name</code>, <code>created_at</code>, <code>-created_at</code>. Equal values use an ID tie-breaker. An unknown sort or invalid range returns 422.</p>
        <div data-block style="position:relative;margin-top:16px;background:var(--surface-ink);border-radius:12px;overflow:hidden">
          <div data-copybar style="display:flex;justify-content:flex-end;padding:8px 8px 0"><button data-copy type="button" style="padding:5px 10px;background:#1E1E1E;border:1px solid #303030;border-radius:8px;color:#A3A3A3;font:var(--fw-bold) 11px/1.2 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:color 140ms var(--ease-smooth),background 140ms var(--ease-smooth)">Copy</button></div>
          <div style="overflow-x:auto"><pre style="padding:6px 20px 20px;font:var(--fw-medium) 13px/1.75 var(--font-mono);color:#E8E8E8"><code>curl 'https://api-lab.arabautomators.com/v1/products?category=computers&amp;in_stock=true&amp;min_price=20&amp;max_price=500&amp;sort=price&amp;page=1&amp;limit=10'
curl 'https://api-lab.arabautomators.com/v1/products?search=keyboard&amp;sort=-rating&amp;limit=5'</code></pre></div>
        </div>
      </section>

      <section id="response" data-sec="response" class="reveal-row" style="scroll-margin-top:80px;animation-delay:180ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:20px">Response structure</h2>
        <div data-block style="position:relative;background:var(--surface-ink);border-radius:12px;overflow:hidden">
          <div data-copybar style="display:flex;justify-content:flex-end;padding:8px 8px 0"><button data-copy type="button" style="padding:5px 10px;background:#1E1E1E;border:1px solid #303030;border-radius:8px;color:#A3A3A3;font:var(--fw-bold) 11px/1.2 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:color 140ms var(--ease-smooth),background 140ms var(--ease-smooth)">Copy</button></div>
          <div style="overflow-x:auto"><pre style="padding:6px 20px 20px;font:var(--fw-medium) 13px/1.75 var(--font-mono);color:#E8E8E8"><code>{
  "success": true,
  "data": [],
  "meta": {"request_id": "example-request", "page": 1, "limit": 20, "total": 50000, "total_pages": 2500, "has_next": true, "has_previous": false},
  "links": {"self": "https://api-lab.arabautomators.com/v1/products?page=1&amp;limit=20", "next": "https://api-lab.arabautomators.com/v1/products?page=2&amp;limit=20", "previous": null}
}</code></pre></div>
        </div>
        <p style="max-width:68ch;margin-top:20px">The empty array above illustrates the envelope; real pages contain records. Single-resource responses have <code>data</code> as one object and <code>meta.request_id</code>. An empty search has <code>total: 0</code>, <code>total_pages: 0</code>, and <code>data: []</code>. Always stop pagination when <code>has_next</code> is false. The catalog starts with 50,000 products, 8,000 customers and 25,000 read-only orders.</p>
      </section>

      <section id="orders" data-sec="orders" class="reveal-row" style="scroll-margin-top:80px;animation-delay:240ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:12px">Write an order</h2>
        <p style="max-width:68ch;margin-bottom:16px">Send POST <code>/v1/orders</code> with your key, <code>Content-Type: application/json</code>, and optionally <code>Idempotency-Key: exercise-001</code>:</p>
        <div data-block style="position:relative;background:var(--surface-ink);border-radius:12px;overflow:hidden">
          <div data-copybar style="display:flex;justify-content:flex-end;padding:8px 8px 0"><button data-copy type="button" style="padding:5px 10px;background:#1E1E1E;border:1px solid #303030;border-radius:8px;color:#A3A3A3;font:var(--fw-bold) 11px/1.2 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:color 140ms var(--ease-smooth),background 140ms var(--ease-smooth)">Copy</button></div>
          <div style="overflow-x:auto"><pre style="padding:6px 20px 20px;font:var(--fw-medium) 13px/1.75 var(--font-mono);color:#E8E8E8"><code>{"customer_id":1,"items":[{"product_id":1,"quantity":2},{"product_id":2,"quantity":1}],"notes":"Generated practice order"}</code></pre></div>
        </div>
        <p style="max-width:68ch;margin-top:20px">Use an in-stock product ID. Each order allows 1–20 distinct products and 1–20 units per product. Price and totals come from the server. Money is USD with two decimal places; shipping is zero for orders of at least $100 or when every item has free shipping, otherwise $5.99. No tax or real payment is charged. Save <code>data.id</code> from the 201 response. With the same idempotency key and body, a retry returns the same order with 200; changing the body while reusing that key returns 409. Replays return the order's current state.</p>
        <p style="max-width:68ch;margin-top:16px">Use your saved ID in these requests:</p>
        <div data-block style="position:relative;margin-top:16px;background:var(--surface-ink);border-radius:12px;overflow:hidden">
          <div data-copybar style="display:flex;justify-content:flex-end;padding:8px 8px 0"><button data-copy type="button" style="padding:5px 10px;background:#1E1E1E;border:1px solid #303030;border-radius:8px;color:#A3A3A3;font:var(--fw-bold) 11px/1.2 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:color 140ms var(--ease-smooth),background 140ms var(--ease-smooth)">Copy</button></div>
          <div style="overflow-x:auto"><pre style="padding:6px 20px 20px;font:var(--fw-medium) 13px/1.75 var(--font-mono);color:#E8E8E8"><code>PATCH  /v1/orders/{id}          {"notes":"Prepared for fulfillment"}
POST   /v1/orders/{id}/pay      (no body)
POST   /v1/orders/{id}/ship     (no body)
GET    /v1/orders/{id}         (read data.tracking_number)
GET    /v1/shipments/{tracking_number}
POST   /v1/orders/{id}/deliver (no body)</code></pre></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:24px;padding:16px 20px;background:var(--surface-sunken);border-radius:12px">
          <span style="font:var(--type-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-right:6px">Lifecycle</span>
          <span style="padding:5px 12px;border-radius:999px;background:var(--surface-card);border:1px solid var(--border-hairline);font:var(--fw-bold) 12px/1.2 var(--font-mono);color:var(--aa-black)">pending</span>
          <span style="color:var(--text-faint)">→</span>
          <span style="padding:5px 12px;border-radius:999px;background:var(--surface-card);border:1px solid var(--border-hairline);font:var(--fw-bold) 12px/1.2 var(--font-mono);color:var(--aa-black)">paid</span>
          <span style="color:var(--text-faint)">→</span>
          <span style="padding:5px 12px;border-radius:999px;background:var(--surface-card);border:1px solid var(--border-hairline);font:var(--fw-bold) 12px/1.2 var(--font-mono);color:var(--aa-black)">shipped</span>
          <span style="color:var(--text-faint)">→</span>
          <span style="padding:5px 12px;border-radius:999px;background:var(--surface-brand);font:var(--fw-bold) 12px/1.2 var(--font-mono);color:var(--text-inverse)">delivered</span>
        </div>
        <p style="max-width:68ch;margin-top:20px">Repeating an action already in its target state is safe and creates no duplicate event. Invalid transitions return 409. To cancel a pending or paid order, PATCH <code>{"status":"cancelled"}</code>; stock is returned once. To practice DELETE, use a pending or already cancelled order. A pending deletion also emits <code>order.cancelled</code>; 204 has no JSON body. Shipped and delivered orders cannot be cancelled/deleted. Other keys cannot see or modify your created orders. Shared seed orders cannot be modified.</p>
      </section>

      <section id="errors" data-sec="errors" class="reveal-row" style="scroll-margin-top:80px;animation-delay:300ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:12px">Headers and error exercises</h2>
        <p style="max-width:68ch;margin-bottom:16px">Send <code>X-Request-ID: lesson-001</code> to correlate responses. The inspector shows custom headers and query parameters. Credential-like field names are redacted, but it is still a training tool: send fake values only.</p>
        <div data-block style="position:relative;background:var(--surface-ink);border-radius:12px;overflow:hidden">
          <div data-copybar style="display:flex;justify-content:flex-end;padding:8px 8px 0"><button data-copy type="button" style="padding:5px 10px;background:#1E1E1E;border:1px solid #303030;border-radius:8px;color:#A3A3A3;font:var(--fw-bold) 11px/1.2 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:color 140ms var(--ease-smooth),background 140ms var(--ease-smooth)">Copy</button></div>
          <div style="overflow-x:auto"><pre style="padding:6px 20px 20px;font:var(--fw-medium) 13px/1.75 var(--font-mono);color:#E8E8E8"><code>{"success":false,"error":{"code":409,"message":"Cannot move an order from pending to shipped.","details":null},"meta":{"request_id":"lesson-001"}}</code></pre></div>
        </div>
        <div style="background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden;margin-top:20px">
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Status</th><th>Exercise</th></tr></thead>
              <tbody>
                <tr><td>200</td><td>Read a product or update an order</td></tr>
                <tr><td>201</td><td>Create an order or webhook</td></tr>
                <tr><td>204</td><td>Delete a pending order/subscription; do not parse a body</td></tr>
                <tr><td>400</td><td>GET <code>/v1/errors/400</code></td></tr>
                <tr><td>401</td><td>Call <code>/v1/private/profile</code> without a key</td></tr>
                <tr><td>403</td><td>GET <code>/v1/errors/403</code></td></tr>
                <tr><td>404</td><td>Request a nonexistent product</td></tr>
                <tr><td>409</td><td>Ship before paying or modify a seed order</td></tr>
                <tr><td>413</td><td>Body exceeds 64 KiB</td></tr>
                <tr><td>422</td><td>Use <code>limit=101</code>, a negative quantity or an unknown sort</td></tr>
                <tr><td>429</td><td>Call rate-limit-demo six times in 60 seconds</td></tr>
                <tr><td>500 / 502 / 503 / 504</td><td>GET <code>/v1/errors/{code}</code> for retry/branching practice</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style="display:flex;gap:0;margin-top:16px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm)">
          <div style="flex:none;width:4px;background:var(--surface-accent)"></div>
          <p style="padding:16px 20px;max-width:68ch">The sixth demo request returns <code>Retry-After</code>; wait that number of seconds before retrying. Normal API limits are separate: 120 requests/minute per key (or anonymous IP), with a 600/minute IP safeguard. Treat the rate-limit headers as the available request budget. Edge-level body/concurrency rejections can have Traefik's response format.</p>
        </div>
      </section>

      <section id="http-node" data-sec="http-node" class="reveal-row" style="scroll-margin-top:80px;animation-delay:360ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <p style="font:var(--type-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">n8n lesson</p>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:16px">HTTP Request</h2>
        <p style="max-width:68ch">Set Method GET, URL <code>https://api-lab.arabautomators.com/v1/products</code>, query <code>category=electronics</code>, <code>limit=10</code>, <code>sort=price</code>, response JSON. Split the output <code>data</code> array to process products. For authenticated calls select Generic Credential Type → Header Auth and your saved credential. For POST use Send Body → JSON and the order body above. Keep SSL verification enabled.</p>
        <p style="max-width:68ch;margin-top:16px">For a short pagination exercise, follow <code><span>{</span><span>{ $response.body.links.next }</span><span>}</span></code> and stop on <code><span>{</span><span>{ !$response.body.meta.has_next }</span><span>}</span></code>; set a one-second interval and a small page cap. For error lessons, Include Response Headers and Status and Never Error expose <code>statusCode</code> for an IF/Switch node. Honor <code>Retry-After</code> with a Wait node. See <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/">n8n HTTP Request documentation</a>.</p>
      </section>

      <section id="webhooks" data-sec="webhooks" class="reveal-row" style="scroll-margin-top:80px;animation-delay:420ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <p style="font:var(--type-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">n8n lesson</p>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:16px">Receive webhooks</h2>
        <p style="max-width:68ch">Create a Webhook node using <strong>POST</strong>, a unique path <code>commerce-lab-001</code>, and an immediate response. Publish/activate the workflow and copy its production URL. Test URLs work only while a test execution listens. See <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/">n8n Webhook documentation</a>.</p>
        <p style="max-width:68ch;margin-top:20px">POST <code>/v1/webhooks</code> with your API key:</p>
        <div data-block style="position:relative;margin-top:16px;background:var(--surface-ink);border-radius:12px;overflow:hidden">
          <div data-copybar style="display:flex;justify-content:flex-end;padding:8px 8px 0"><button data-copy type="button" style="padding:5px 10px;background:#1E1E1E;border:1px solid #303030;border-radius:8px;color:#A3A3A3;font:var(--fw-bold) 11px/1.2 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:color 140ms var(--ease-smooth),background 140ms var(--ease-smooth)">Copy</button></div>
          <div style="overflow-x:auto"><pre style="padding:6px 20px 20px;font:var(--fw-medium) 13px/1.75 var(--font-mono);color:#E8E8E8"><code>{"url":"https://your-instance.arabautomators.com/webhook/commerce-lab-001","events":["order.created","order.paid","order.shipped","order.delivered","order.cancelled"]}</code></pre></div>
        </div>
        <p style="max-width:68ch;margin-top:20px">Store the returned <code>id</code> and one-time <code>signing_secret</code> securely. Trigger an event by creating/updating an order under the same key. The receiver gets:</p>
        <div data-block style="position:relative;margin-top:16px;background:var(--surface-ink);border-radius:12px;overflow:hidden">
          <div data-copybar style="display:flex;justify-content:flex-end;padding:8px 8px 0"><button data-copy type="button" style="padding:5px 10px;background:#1E1E1E;border:1px solid #303030;border-radius:8px;color:#A3A3A3;font:var(--fw-bold) 11px/1.2 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:color 140ms var(--ease-smooth),background 140ms var(--ease-smooth)">Copy</button></div>
          <div style="overflow-x:auto"><pre style="padding:6px 20px 20px;font:var(--fw-medium) 13px/1.75 var(--font-mono);color:#E8E8E8"><code>{"id":"evt_example","type":"order.created","api_version":"1.0","created_at":"2026-09-11T12:00:00Z","livemode":false,"data":{"order":{"id":25001,"customer_id":1,"status":"pending","currency":"USD","total":79.98}}}</code></pre></div>
        </div>
        <p style="max-width:68ch;margin-top:20px">This abbreviated example omits the full order items, notes, timestamps and shipping fields. In n8n use <code>$json.body.type</code>, <code>$json.body.id</code> and <code>$json.body.data.order.id</code>. Use a Switch node to branch by event type. List <code>/v1/webhooks/{id}/deliveries</code> to diagnose results. The receiver must return 2xx; 404 usually means the workflow is inactive or the path/method is wrong.</p>
        <p style="max-width:68ch;margin-top:16px">Each event has a stable ID; deduplicate it because retries can deliver an event again. Five attempts maximum, with increasing delays; events may arrive out of order during retries. No API key is sent to the receiver. HMAC verification uses <code>X-Webhook-Signature</code> and <code>X-Webhook-Timestamp</code>: calculate hex HMAC-SHA256 over <code>timestamp + "." + raw_body</code>, using the signing secret, and compare to the signature after the <code>sha256=</code> prefix. Verify the timestamp is recent. Use the original bytes, not re-serialized JSON. Full verification details are in the operator README.</p>
        <div style="display:flex;gap:0;margin-top:20px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm)">
          <div style="flex:none;width:4px;background:var(--surface-brand)"></div>
          <p style="padding:16px 20px;max-width:68ch">Targets must be HTTPS public subdomains of <code>arabautomators.com</code>, port 443, with a <code>/webhook/…</code> or <code>/webhook-test/…</code> path; no URL credentials, query or fragment. Private IP addresses and redirects are blocked. Subscriptions belong to one key and never receive other workspaces' events. Delete the subscription when an exercise is finished.</p>
        </div>
      </section>

      <sc-if value="{{ showExercises }}" hint-placeholder-val="{{ true }}">
      <section id="exercises" data-sec="exercises" class="reveal-row" style="scroll-margin-top:80px;animation-delay:480ms">
        <div style="width:40px;height:3px;background:var(--aa-black);margin-bottom:16px"></div>
        <h2 style="font:var(--type-title);letter-spacing:var(--tr-tighter);color:var(--text-strong);margin-bottom:20px">Suggested exercises</h2>
        <ol style="display:flex;flex-direction:column;gap:0;max-width:68ch">
          <li>Compare path parameters, query parameters and request headers with products and the inspector.</li>
          <li>Find five in-stock computer products costing under $500, sorted by rating.</li>
          <li>Join product category, brand and seller IDs to the corresponding list endpoints.</li>
          <li>Page through customers from one country using fake <code>example.test</code> emails.</li>
          <li>Create an order, replay it with an idempotency key, and confirm one order ID.</li>
          <li>Route an order through paid, shipped and delivered; inspect its shipment.</li>
          <li>Receive all five webhook events and route them with a Switch node.</li>
          <li>Handle 401, 409, 422, 429 and simulated 503 responses.</li>
        </ol>
        <div style="display:flex;gap:0;margin-top:24px;background:var(--surface-card);border:1px solid var(--border-hairline);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm)">
          <div style="flex:none;width:4px;background:var(--aa-neutral-950)"></div>
          <p style="padding:16px 20px;max-width:68ch">Ask the instructor to reset your anonymous workspace when necessary; a reset removes its training writes and subscriptions. A complete lab reseed also invalidates learner keys and requires new credentials.</p>
        </div>
      </section>
      </sc-if>

    </main>
  </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props="{&quot;showCopyButtons&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:true,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Behavior&quot;},&quot;highlightWriteMethods&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:true,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Behavior&quot;},&quot;showExercises&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:true,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Content&quot;}}">
class Component extends DCLogic {
  componentDidMount() {
    this.root = document.body;
    this.onClick = (e) => {
      const btn = e.target.closest && e.target.closest('[data-copy]');
      if (!btn) return;
      const block = btn.closest('[data-block]');
      const code = block && block.querySelector('code');
      if (!code) return;
      const text = code.textContent;
      const isIconButton = btn.classList.contains('lab-copy-btn');
      const done = () => {
        if (isIconButton) {
          btn.classList.add('is-copied');
          clearTimeout(btn._t);
          btn._t = setTimeout(() => { btn.classList.remove('is-copied'); }, 1600);
          return;
        }
        btn.textContent = 'Copied';
        btn.style.color = 'var(--aa-green-300)';
        clearTimeout(btn._t);
        btn._t = setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = '#A3A3A3'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => this.fallbackCopy(text, done));
      } else {
        this.fallbackCopy(text, done);
      }
    };
    document.addEventListener('click', this.onClick);

    const links = Array.from(document.querySelectorAll('[data-nav]'));
    const setActive = (id) => {
      links.forEach((a) => {
        const on = a.getAttribute('data-nav') === id;
        a.style.background = on ? 'var(--surface-brand-soft)' : 'transparent';
        a.style.color = on ? 'var(--aa-green-700)' : 'var(--text-muted)';
      });
    };
    this.setActive = setActive;
    const secs = Array.from(document.querySelectorAll('[data-sec]'));
    if (secs.length) {
      setActive(secs[0].getAttribute('data-sec'));
      this.io = new IntersectionObserver((entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.getAttribute('data-sec'));
      }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
      secs.forEach((s) => this.io.observe(s));
    }
    this.applyProps();
  }

  componentDidUpdate() { this.applyProps(); }

  applyProps() {
    const copy = this.props.showCopyButtons !== false;
    document.querySelectorAll('[data-copybar]').forEach((b) => { b.style.display = copy ? 'flex' : 'none'; });
    document.querySelectorAll('[data-block] pre').forEach((p) => {
      p.style.paddingTop = copy ? '6px' : '20px';
    });
    const hi = this.props.highlightWriteMethods !== false;
    document.querySelectorAll('td[data-write]').forEach((td) => {
      td.style.color = hi ? 'var(--aa-green-700)' : 'var(--aa-black)';
    });
  }

  fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClick);
    if (this.io) this.io.disconnect();
  }

  renderVals() {
    return { showExercises: this.props.showExercises !== false };
  }
}
</script>`;
