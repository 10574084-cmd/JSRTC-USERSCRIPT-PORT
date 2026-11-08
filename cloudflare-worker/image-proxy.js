/**
 * jsRTC Cloudflare image proxy.
 * Configure Worker variable ALLOWED_HOSTS with exact comma-separated hostnames.
 * Example: cdn.example.com,images.example.net
 * This is deliberately an allowlisted proxy, not an open proxy.
 */
const MAX_BYTES = 8 * 1024 * 1024;
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300"
    };
    if (request.method === "OPTIONS") return new Response(null, {status:204, headers});
    if (request.method !== "GET") return new Response("Method not allowed", {status:405, headers});
    const raw = new URL(request.url).searchParams.get("url");
    if (!raw) return new Response("Missing url parameter", {status:400, headers});
    let target;
    try { target = new URL(raw); } catch { return new Response("Invalid URL", {status:400, headers}); }
    if (target.protocol !== "https:" || target.username || target.password || (target.port && target.port !== "443")) {
      return new Response("Only HTTPS URLs on port 443 are allowed", {status:400, headers});
    }
    const allowed = String(env.ALLOWED_HOSTS || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
    if (!allowed.includes(target.hostname.toLowerCase())) return new Response("Host not allowed", {status:403, headers});
    let upstream;
    try { upstream = await fetch(target.href, {redirect:"manual", headers:{Accept:"image/*"}}); }
    catch { return new Response("Upstream fetch failed", {status:502, headers}); }
    if (upstream.status >= 300 && upstream.status < 400) return new Response("Redirect blocked; use the final image URL and allow its hostname", {status:502, headers});
    if (!upstream.ok) return new Response("Upstream HTTP " + upstream.status, {status:502, headers});
    const type = (upstream.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/")) return new Response("Upstream is not an image", {status:415, headers});
    const declared = Number(upstream.headers.get("Content-Length") || 0);
    if (declared > MAX_BYTES) return new Response("Image exceeds 8 MiB", {status:413, headers});
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return new Response("Image exceeds 8 MiB", {status:413, headers});
    headers["Content-Type"] = type;
    headers["Content-Length"] = String(bytes.byteLength);
    headers["Content-Disposition"] = "inline";
    return new Response(bytes, {status:200, headers});
  }
};
