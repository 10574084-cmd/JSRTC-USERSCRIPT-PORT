# Cloudflare image proxy setup

This optional Worker lets jsRTC fetch public HTTPS images through a small allowlisted proxy when the browser cannot read the original image because of CORS.

## 1. Create the Worker

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages** and create a Worker.
3. Open its code editor and replace the sample code with `image-proxy.js` from this folder.
4. Deploy the Worker and copy its HTTPS URL.

## 2. Set the allowed image hosts

In the Worker settings, add a text environment variable:

- Name: `ALLOWED_HOSTS`
- Value: exact hostnames separated by commas, for example `images.example.com,cdn.example.net`

Only add image hosts you trust and are allowed to access. Do not use a wildcard. If an image redirects to another host, add that final host and use the direct image URL; redirects are intentionally not followed.

## 3. Connect jsRTC

1. Update/install the latest `jsRTC.user.js` from this repository in Violentmonkey.
2. Open a webpage and open the jsRTC panel.
3. Paste the Worker HTTPS URL into **CLOUDFLARE IMAGE PROXY URL**.
4. Choose a pixel corruption mode and press **BLAST ONCE**.

When the field is set, external HTTPS images are fetched through the Worker. Leave it empty to use the browser's direct image path.

## Limits and safety

- The Worker is intentionally **not an open proxy**: it only fetches hostnames listed in `ALLOWED_HOSTS`.
- It accepts HTTPS on the default port only, does not follow redirects, and limits image responses to 8 MiB.
- The origin must provide a public image response. Private pages, authenticated content, hotlink protection, and some CDNs may still refuse access.
- This affects the image displayed in the current page only. It does not rewrite the original server file.
- Worker usage is subject to Cloudflare account limits and terms. Keep the allowlist narrow; do not publish a Worker that proxies arbitrary URLs.
