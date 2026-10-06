# AIOMobile deployment

Serve the static app at `/mobile/` on the same HTTPS hostname as AIOStreams and leave the app’s base URL setting blank. AIOMobile uses the existing AIOStreams admin session.

Start with the [quick installation steps](../README.md#install), then use the [deployment guide](INSTALL.md) for other reverse proxies, updates, rollback, iPhone checks and release packaging. The Compose example runs a separate static service and preserves your existing API/login routing. Copy `.env.example` to a private `.env` and match your existing hostname, Docker network, TLS resolver and authentication middleware.

Build the current source with `npm ci` and `npm run build`. Current source includes retained usage, provider history, read-only Background tasks, Usenet Library, Media Info and Addon health. The original 0.1.0 release archives predate those additions; package a new version when distributing an updated archive.

Before an update, retain a private backup of the current site and configuration. Upload new fingerprinted assets first, keep older assets available for open clients, and publish `index.html` and `sw.js` last. Static changes do not require restarting AIOStreams. Reopen the app and select **Update** when prompted.

Keep actual deployment hostnames, private paths, production data, credentials and rollback evidence outside the public repository. `releases/` and real environment files are ignored. See the [validation notes](../docs/validation.md) for the scope of source and fixture verification; authenticated payloads and physical iPhone behavior require operator checks.
