# VocabProfiler

[中文 README](../README.md)

VocabProfiler is a self-hosted vocabulary learning app. It separates words saved for later from words you intend to study now, so your notebook's study count stays meaningful.

## Features

- **Notebooks:** study Active words in both directions and Passive words in the recognition direction; manage multiple meanings, edit entries, and import word packs.
- **Notes:** save words without adding them to study or review counts. When ready, copy a note into a chosen notebook; identical entries already in that notebook are skipped.
- **Study and review:** separate new words from due words, with outcomes for mastered, unclear, and forgotten items. Active words consider both directions.
- **Desktop and mobile:** responsive interface, with a shortcut hint beside the notebook or note selector on desktop.

See the [memory design overview](./memory-design.md) (Chinese) and [database schema](./database.md).

## Stack

The client uses Vue 3, Vuetify, and Vite. The server uses Node.js, Express, and MySQL. The browser calls same-origin `/api` URLs; the server's routes are `/user`, `/word`, `/notebook`, `/notes`, and `/wordpack`.

## Run locally

Install Node.js, npm, and MySQL first.

1. Create a database named `vocab_profiler_db` and run the table definitions in [database.md](./database.md) in order. The current API routes use this database name directly; changing only `db.database` in YAML is insufficient.
2. Copy `codes/server/.env.example` to `codes/server/.env`. Set `DB_PASSWORD`, a long random `JWT_SECRET`, and `JWT_EXPIRES_IN`. Never commit the real `.env` file.
3. Check [config.yaml](../codes/server/config/config.yaml) for the database host, port and user, plus the server bind address. The YAML contains public settings; secrets are read from `.env`.
4. Start the server:

```sh
cd codes/server
npm ci
node bin/www
```

In another terminal, starting from the repository root:

```sh
cd codes/client
npm ci
npm run dev
```

The development page normally opens at `http://localhost:8443`. Vite proxies `/api` to `http://127.0.0.1:3000`. Despite the port number, the current dev configuration uses HTTP. If 8443 is occupied, check Vite's terminal output for the selected port.

## Self-host

One option is to install PM2, run the API with it, and serve the built client with Nginx:

```sh
cd codes/client
npm ci
npm run build

cd ../server
npm ci --omit=dev
pm2 start bin/www --name vocab-profiler
```

Start the API with `codes/server` as its working directory so it finds `.env`. The built client is in `codes/client/dist`. Replace the `root` path below with your absolute path:

```nginx
server {
    listen 80;
    server_name example.com;
    root /absolute/path/to/VocabProfiler/codes/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Keep the trailing `/` in `proxy_pass`: it removes `/api/` before forwarding, so `/api/user/login` reaches `/user/login` on Express. Use HTTPS at the public reverse proxy for a real deployment.

| Service | Default port | Suggested exposure |
| --- | --- | --- |
| MySQL | 3306 | Reachable by the API only |
| Express API | 3000 | Bound to `127.0.0.1` by default; used by the local reverse proxy |
| Vite development server | 8443 | Development only |
| Nginx site | 80 / 443 | Public entry point |

If the database or reverse proxy is on a different host, update [config.yaml](../codes/server/config/config.yaml) and your firewall rules. Same-origin hosting does not require cross-origin requests; for separate frontend and API origins, update `cors.origin` and review the Cookie settings.

## Files and secrets

`codes/server/config/config.yaml` is tracked and should contain only public settings and references to environment variables. Real `.env` files, runtime logs, generated word packs, dependencies, and build outputs are ignored. The required logger source `codes/server/logs/Winston.js` and safe `.env.example` are included.
