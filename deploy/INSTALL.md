# AIOMobile release deployment

AIOMobile is a static monitoring PWA for an existing AIOStreams instance. Serve it at `/mobile/` on the same origin as AIOStreams and leave its base URL setting blank. It uses the existing admin session cookie; no backend, provider credentials, or new authentication system is required.

The deployment archive includes `compose.yaml`, `nginx.conf`, `.env.example`, `site/mobile/`, LICENSE, and NOTICE. The source archive includes the React app, pinned npm lockfile, build/test scripts, and documentation.

## First install with Traefik

1. Verify the archive against SHA256SUMS before extracting.
2. Extract the deployment archive to a new standalone app directory. Keep it outside the parent Compose include list.
3. Copy `.env.example` to `.env` and set `AIOSTREAMS_HOSTNAME` to the existing AIOStreams hostname. Match your existing Docker network, authentication middleware, and TLS resolver. Keep your existing authentication middleware enabled.
4. From that directory, run:

```sh
docker compose -p aiomobile config --quiet
docker compose -p aiomobile run --rm --no-deps aiomobile -t
docker compose -p aiomobile up -d --no-deps aiomobile
docker compose -p aiomobile ps
```

Traefik handles only `/mobile` and `/mobile/…` through the new service. Existing API/login routes continue going to AIOStreams. The Nginx service publishes no host port and runs as UID/GID 101 on a read-only filesystem, with a pinned image digest, dropped capabilities, and Watchtower disabled.

Other reverse proxies can serve `site/mobile/` at the same path; see [Other reverse proxies](#other-reverse-proxies) below.

## Updating an existing deployment

Keep the existing `.env`. Archive the current static directory/configuration before changes. Extract a new deployment archive to a separate staging directory and validate its configuration there first.

Copy new fingerprinted files from `site/mobile/assets/` into the live assets directory without deleting older assets; then copy the remaining static files. Retaining old JS/CSS prevents open clients from losing their existing build during an update. Deploy `index.html` and `sw.js` last so a new worker only advertises files already present. The app prompts users to activate a new worker.

Static updates do not require restarting AIOStreams. If the static service configuration or Nginx image changes, recreate only the `aiomobile` service:

```sh
docker compose -p aiomobile up -d --no-deps aiomobile
```

Verify the shell, manifest, worker, icons, and fingerprinted assets over HTTPS. Dashboard APIs must still require an admin session. Sign in and check Streams, Usenet, History and Indexers.

## Rollback

Restore the previous static snapshot/configuration and recreate only `aiomobile` if its configuration changed. Keep all assets used by both builds until clients have updated. To remove the static service and its Traefik route entirely:

```sh
docker compose -p aiomobile down
```

This leaves the external Docker network and deployment files intact. Installed clients may still open their cached shell until their browser site data is cleared.

## iPhone testing

Open the HTTPS URL in Safari. Sign in with an AIOStreams admin account. Tap Share → Add to Home Screen, enabling Open as Web App if shown. An installed app may need its own login. All live data requires a connection; the cached shell contains no authenticated API data.

Compatibility: inspected upstream source commit is recorded in `docs/api-contract.md`; browser checks cover Chromium and WebKit. Physical iPhone installation should be checked by the operator. Avoid testing Stop on a stream unless interrupting that playback is intentional.


## Other reverse proxies

Build from source with `npm ci` and `npm run build`. Copy the contents of `dist/` to your static server's `mobile/` directory, preserving `assets/` and `icons/`. Serve `/mobile/` on the existing AIOStreams hostname. Keep your existing TLS, authentication, forwarded-header trust and API/login routing.

For Nginx, these locations assume the app is at `/srv/www/mobile/`. Add them inside your existing HTTPS server block:

```nginx
location = /mobile { return 301 /mobile/; }
location = /mobile/sw.js {
    root /srv/www;
    add_header Cache-Control "no-cache, no-store" always;
    try_files $uri =404;
}
location /mobile/assets/ {
    root /srv/www;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
}
location /mobile/ {
    root /srv/www;
    add_header Cache-Control "no-cache" always;
    try_files $uri $uri/ /mobile/index.html;
}
```

On your existing AIOStreams dashboard API proxy, disable buffering and caching for SSE and allow long-lived connections:

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 1h;
```

Keep the existing `proxy_pass` and authentication directives. These snippets add static serving and SSE support; they do not replace the working AIOStreams proxy.

## Building release archives

From the source checkout, with Node.js 22.18+ and Python 3 installed:

```sh
npm ci
npm run release:package
```

This validates and builds the app, then writes deployment/source archives, SHA256SUMS and release notes into `releases/`. The deployment archive includes `site/mobile/`, Compose/Nginx configuration and `.env.example`. Verify checksums before extracting. Preserve accepted archives; choose a new package version before packaging a new release under the same name. See [CHANGELOG.md](../CHANGELOG.md) for release history.
