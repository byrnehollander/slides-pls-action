# slides-pls 📽️

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-slides--pls-blue?logo=github)](https://github.com/marketplace/actions/slides-pls)

> Turn PR diffs into presentations your team will actually read

Comment `/slides` on any PR → get a deployed presentation explaining the changes.

## Setup (1 minute)

**1. Copy this workflow** to `.github/workflows/slides.yml`:

```yaml
name: PR Slides
on:
  issue_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  slides:
    if: github.event.issue.pull_request && contains(github.event.comment.body, '/slides')
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: byrnehollander/slides-pls-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**2. Add secrets** (Settings → Secrets and variables → Actions):

| Secret | Get it from |
|--------|-------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| `CLOUDFLARE_API_TOKEN` | [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) (needs Pages:Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare dashboard sidebar |

**3. Comment `/slides` on any PR.** Done!

---

## Options

| Input | Default | Description |
|-------|---------|-------------|
| `command` | `/slides` | Trigger command |
| `project_prefix` | repo name | URL prefix (`acme` → `acme-pr-123.pages.dev`) |
| `model` | `claude-sonnet-4-20250514` | Use `claude-opus-4-5-20250514` for higher quality |
| `deployment` | `cloudflare` | Or `artifact-only` to deploy yourself |

```yaml
# Example with options
- uses: byrnehollander/slides-pls-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: '/generate-slides'
    project_prefix: 'mycompany'
```

You can also pass instructions: `/slides Focus on the security implications`

---

## Troubleshooting

**Build errors?** The action retries with progressively simpler HTML. Check workflow logs for details.

**Cloudflare failed?** Verify your API token has "Cloudflare Pages:Edit" permission.

---

## License

MIT — built on [Slidev](https://sli.dev/), [claude-code-action](https://github.com/anthropics/claude-code-action), and [Cloudflare Pages](https://pages.cloudflare.com/)
