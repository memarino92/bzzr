# bzzr

A small, realtime buzzer for big trivia nights.

Built with RedwoodSDK, React, Tailwind CSS, and Cloudflare Durable Objects.
Host a room, invite players with a short code, and see who buzzed first.
Questions, answers, scoring, and video calls stay outside the app.

## Development

Use Node 24+ and pnpm 11.19.0.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm generate
pnpm dev
```

Open http://localhost:5173. Cloudflare resources run locally through workerd.
No secrets or Cloudflare account are needed for development.

- [AI instructions](AGENTS.md)
- [Platform decision](docs/decisions/0001-platform-and-boundaries.md)
- [MIT license](LICENSE) · [Third-party notices](THIRD_PARTY_NOTICES.md)

Implementation, tests, Storybook, and operating docs are being built in logical commits.
