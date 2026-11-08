# vigilant-harvest-app

## The live services

`.env.production` names the live services on `theferalrooster.com`: feral-authentication-service
and vigilant-harvest-service. Every production build calls them: `vite build`'s output, `npm run
serve` (`vite preview`), and the Docker image. The dev server reads `.env.development`, which
names the local ones.

- Run the app, and both suites, against the dev server that `../start-vigilant-harvest.sh` starts,
  and the local services it starts beside it.
- `npm run build` is safe to run: building calls nothing. Keep the built app closed: never serve
  it, open it, or point a test at it.
- Send requests only to `localhost`. Nothing goes to `theferalrooster.com`: no `curl`, no
  scripts, no tests.
- To inspect a production bundle, build it with the `VITE_*_BASE_URL`s overridden to
  `https://example.invalid`, and grep the output for `theferalrooster` before anything loads it.

feral-authentication's UI suite once wrote test data to its live service from `vite preview`.
This app's UI suite guards against the same (`spec/ui/README.md`, "Safety: local services
only"). Keep those guards as strong as they are.

## Tests

- The UI suite needs the four local processes up (`../start-vigilant-harvest.sh`; the services
  need MySQL) and the gardener's credentials in the gitignored `spec/helpers/ui/.env.ui`.
  `spec/ui/README.md` covers the rest.
- Wrong behaviour is pinned, not fixed, with a `// DocumentsCurrentBehavior:` comment and a
  backlog row in `ai-changelogs/projects/vigilant-harvest-app/2026-11-03-2-pinned-behaviour.md`.
  A change that makes a pin fail is a behaviour change: say so, rather than rewriting the pin.
