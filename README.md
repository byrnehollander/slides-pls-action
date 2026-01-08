# slides-pls 📽️

> Turn PR diffs into presentations your team will actually read

Big PRs are hard to review. Code changes don't tell the full story—why was this approach chosen? What patterns does this follow? What should reviewers focus on?

**slides-pls** uses Claude AI to analyze your PR, explore the codebase for context, and generate a presentation that explains the changes. Comment `/slides` on any PR to try it.

## Quick Start (2 minutes)

### 1. Add the workflow

Create `.github/workflows/slides.yml`:

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
    steps:
      - uses: byrnehollander/slides-pls-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

### 2. Add secrets

In your repo settings → Secrets and variables → Actions:

| Name | Where to get it |
|------|-----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| `CLOUDFLARE_API_TOKEN` | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) - needs "Cloudflare Pages:Edit" permission |
| `CLOUDFLARE_ACCOUNT_ID` | Found in your Cloudflare dashboard URL or sidebar |

> **Note:** All inputs accept either secrets (`${{ secrets.X }}`) or variables (`${{ vars.X }}`). Use whichever fits your setup.

### 3. Use it

Comment `/slides` on any PR. That's it!

---

## Configuration

### All Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `anthropic_api_key` | **Yes** | - | Your Anthropic API key |
| `github_token` | **Yes** | - | GitHub token for PR access |
| `deployment` | No | `cloudflare` | `cloudflare` or `artifact-only` |
| `cloudflare_api_token` | If cloudflare | - | Cloudflare API token |
| `cloudflare_account_id` | If cloudflare | - | Cloudflare account ID |
| `project_prefix` | No | repo name | URL prefix (e.g., `acme` → `acme-pr-123.pages.dev`) |
| `model` | No | `claude-sonnet-4-20250514` | Claude model to use |
| `command` | No | `/slides` | Trigger command in comments |

### Outputs

| Output | Description |
|--------|-------------|
| `slides_url` | URL to the deployed presentation |
| `slides_path` | Path to built slides directory |

---

## Examples

### Basic (Cloudflare deployment)

```yaml
- uses: byrnehollander/slides-pls-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

### Custom command and prefix

```yaml
- uses: byrnehollander/slides-pls-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    command: '/generate-slides'      # Custom trigger
    project_prefix: 'mycompany'      # mycompany-pr-123.pages.dev
```

### Use Claude Opus for higher quality

```yaml
- uses: byrnehollander/slides-pls-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    model: 'claude-opus-4-5-20250514'
```

### Artifact-only (no deployment)

If you want to deploy yourself or just download the slides:

```yaml
- uses: byrnehollander/slides-pls-action@v1
  id: slides
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    deployment: 'artifact-only'

# Slides are available as an artifact and at ${{ steps.slides.outputs.slides_path }}
```

### Migrating from a custom workflow

If you have an existing slides workflow with custom settings:

```yaml
- uses: byrnehollander/slides-pls-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}  # or vars.X
    command: '/generate-slides'     # Your existing trigger
    project_prefix: 'myapp'         # Your existing URL prefix
    model: 'claude-opus-4-5-20250514'  # Optional: use Opus
```

---

## Passing Instructions

You can pass extra instructions after the command:

```
/slides Focus on the security implications
```

```
/slides This is a performance optimization, explain the tradeoffs
```

---

## Troubleshooting

### "slides.md was not generated"

Claude may have failed to write the file. Check the workflow logs for the Claude step.

### Build errors

The action has a 3-attempt fallback system:
1. Normal Slidev build
2. Stripped HTML (removes custom styling)
3. Minimal error page

If all fail, check the logs for the specific Vue/HTML error.

### Cloudflare deployment failed

- Verify your `CLOUDFLARE_API_TOKEN` has "Cloudflare Pages:Edit" permission
- Verify your `CLOUDFLARE_ACCOUNT_ID` is correct (it's a 32-character hex string)

---

## License

MIT

---

## Contributing

Issues and PRs welcome! This action is built on:
- [Slidev](https://sli.dev/) - Presentation framework
- [claude-code-action](https://github.com/anthropics/claude-code-action) - Claude integration
- [Cloudflare Pages](https://pages.cloudflare.com/) - Deployment
