# Deployment notes

## nginx: `/uploads/` must be proxied to the backend

Uploaded files (product/logo/banner images, KYC docs, etc.) are stored on the
backend's local disk (`backend/uploads/`, configurable via `UPLOADS_DIR`) and
served by the Node process itself via `express.static` at `/uploads`
(`backend/src/app.js`). They are **not** part of the frontend's static build
output in `dist/`.

If nginx (or any reverse proxy in front of the app) only proxies `/api/` to
the backend and serves everything else as the frontend SPA, requests to
`/uploads/<file>` will silently fall through to the SPA's `index.html`
fallback (`try_files $uri $uri/ /index.html`) — returning `200 OK` with
`Content-Type: text/html` instead of the image. This is easy to miss because
it "succeeds" instead of erroring, and it never shows up in local dev because
Vite's dev proxy (`frontend/vite.config.js`) already proxies `/uploads` to
the backend for you.

**Any nginx vhost serving this app in production needs a `/uploads/` proxy
block in addition to `/api/`**, e.g.:

```nginx
location /uploads/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

(Port `5000` should match the backend's `PORT` env var.)

This was missing on the production nginx config as of 2026-08-06, which made
every uploaded image/logo appear broken on the live site while working fine
locally — fixed directly on the server's
`/etc/nginx/sites-enabled/default.conf`. `backend/deploy.sh`'s deploy script
does not touch nginx config, so this fix persists across normal deploys; it
only needs to be reapplied if the server/vhost is ever re-provisioned from
scratch.
