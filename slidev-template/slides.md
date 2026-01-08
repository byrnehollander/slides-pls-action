---
theme: default
colorSchema: dark
favicon: 'https://fav.farm/📽️'
title: "slides-pls Demo"
layout: cover
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# slides-pls Demo

This is a placeholder. Real slides are generated from PR diffs.

---

# How It Works

1. Comment `/slides` on any PR
2. Claude AI analyzes the diff
3. Beautiful presentation is generated
4. Deployed automatically to Cloudflare Pages

---

# Get Started

```yaml
- uses: byrnehollander/slides-pls-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```
