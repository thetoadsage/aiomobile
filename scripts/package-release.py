"""Produce explicit, reproducible source/static archives; never copy local secrets."""
from pathlib import Path
import gzip
import hashlib
import io
import json
import tarfile

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
OUTPUT = ROOT / 'releases'
OUTPUT.mkdir(exist_ok=True)


def read(path):
    return (ROOT / path).read_bytes()


def archive(name, files):
    target = OUTPUT / name
    with target.open('wb') as raw, gzip.GzipFile(filename='', fileobj=raw, mode='wb', mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode='w', format=tarfile.USTAR_FORMAT) as tar:
            for path, content in sorted(files.items()):
                info = tarfile.TarInfo(path)
                info.size = len(content)
                info.mode = 0o644
                info.mtime = 0
                tar.addfile(info, io.BytesIO(content))
    return target


def collect(directory):
    result = {}
    for path in (ROOT / directory).rglob('*'):
        if not path.is_file():
            continue
        if path.is_symlink():
            raise ValueError(f'Refusing symlink: {path.relative_to(ROOT)}')
        if any(part.startswith('.') for part in path.relative_to(ROOT).parts):
            continue
        result[str(path.relative_to(ROOT))] = path.read_bytes()
    return result


static = {f'site/mobile/{path.removeprefix("dist/")}': content for path, content in collect('dist').items()}
for name, original in {'compose.yaml': 'deploy/compose.yaml', 'nginx.conf': 'deploy/nginx.conf', '.env.example': 'deploy/.env.example', 'README.md': 'deploy/INSTALL.md', 'LICENSE': 'LICENSE', 'NOTICE': 'NOTICE', 'CHANGELOG.md': 'CHANGELOG.md'}.items():
    static[name] = read(original)

source = {}
for directory in ['src', 'public', 'scripts', 'tests', 'docs']:
    source.update(collect(directory))
for name in ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts', 'tsconfig.json', 'eslint.config.js', 'README.md', 'CHANGELOG.md', 'LICENSE', 'NOTICE', '.gitignore']:
    source[name] = read(name)
for name in ['compose.yaml', 'nginx.conf', '.env.example', 'INSTALL.md']:
    source[f'deploy/{name}'] = read(f'deploy/{name}')
# Replace the local deployment handoff and project memory with portable copies.
source['deploy/README.md'] = read('deploy/INSTALL.md')
source['memory.md'] = f'''# AIOMobile release memory\n\nVersion {VERSION}. React/TypeScript/Vite static monitoring PWA. Runtime dependencies: React and React DOM. Serve at /mobile/ on an existing AIOStreams origin; blank base URL, existing admin session cookie.\n\nSee docs/api-contract.md for upstream provenance/types and CHANGELOG.md for release validation. SSE live hooks are at app root; fallback polling is bounded, auth errors suspend retries, charts stay in memory, and the service worker caches only static assets. No secrets are persisted.\n\nSee deploy/INSTALL.md for scoped static deployment, updates, and rollback. Maintain this memory.md when extending the project.\n'''.encode()

for payload in [source, static]:
    for name in payload:
        parts = Path(name).parts
        if '..' in parts or name.startswith('/') or any(part.startswith('._') for part in parts):
            raise ValueError(f'Unsafe archive name: {name}')
        if Path(name).name.startswith('.env') and Path(name).name != '.env.example':
            raise ValueError(f'Refusing environment file: {name}')

outputs = [archive(f'AIOMobile-v{VERSION}-deploy.tar.gz', static), archive(f'AIOMobile-v{VERSION}-source.tar.gz', source)]
(OUTPUT / 'SHA256SUMS').write_text(''.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n' for path in outputs))
notes = f'''# AIOMobile v{VERSION}\n\nFirst tested release: a mobile-first monitoring PWA for AIOStreams, served at /mobile/ on the existing instance origin.\n\nIncludes Overview, Streams/Details, Usenet/Providers, Indexers, History/Bandwidth, Settings, live SSE with REST fallback, cookie-session authentication, confirmed stream stop, and static-only offline support.\n\nAssets:\n- AIOMobile-v{VERSION}-deploy.tar.gz: ready-built static app, portable Compose/Nginx configuration, installation guide and license.\n- AIOMobile-v{VERSION}-source.tar.gz: corresponding source, lockfile, tests and build/release scripts.\n- SHA256SUMS: SHA-256 checksums of both archives.\n\nTypeScript, lint, build, seven unit tests and fourteen Chromium/WebKit tests passed; the operator reported live testing passed. The agent has not independently verified authenticated live payloads or physical iPhone installation.\n\nNo new backend or auth system. Existing AIOStreams admin access is required. Match your existing Traefik authentication middleware when deploying. AGPL-3.0-only; see LICENSE and upstream NOTICE.\n'''
(OUTPUT / 'release-notes.md').write_text(notes)
print(f'Prepared v{VERSION}:')
for path in outputs:
    print(f'  {path.name}: {path.stat().st_size:,} bytes')
print('  SHA256SUMS and release-notes.md')
