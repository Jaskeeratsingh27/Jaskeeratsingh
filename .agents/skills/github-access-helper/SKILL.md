---
name: github-access-helper
description: Help the user connect ChatGPT/Codex to GitHub, authorize repository access, verify whether the GitHub App can see and write to repositories, and provide the correct one-click setup or management link when access is missing. Trigger when the user asks to connect GitHub, authorize a repo, give ChatGPT access to a new repo, check GitHub access, fix missing repository access, or write/commit to GitHub.
---

# GitHub Access Helper

Use this workflow whenever the user wants ChatGPT or Codex to access, maintain, edit, or commit to GitHub repositories.

## Goal

Get the user from "GitHub is connected but the repo is not available" to verified repository access with the fewest possible steps.

## Workflow

1. **Verify access first**
   - Check the authenticated GitHub profile.
   - Check GitHub App installations.
   - List accessible repositories.
   - Do not claim write access until the target repository is visible and its permissions show push/write access.

2. **If the ChatGPT Codex Connector is not installed**
   Give the user this direct installation link:

   https://github.com/apps/chatgpt-codex-connector/installations/new

   Tell them to:
   - choose the GitHub account,
   - select **All repositories** or the repositories they want ChatGPT to access,
   - complete the installation,
   - then return and say **check now**.

3. **If the connector is installed but the target repo is missing**
   - Prefer the installation's own `html_url` returned by the GitHub tool when available.
   - Otherwise give:
     https://github.com/settings/installations
   - Tell the user to open the ChatGPT Codex Connector configuration and add the repository, or switch to **All repositories**.

4. **If repository_selection is `all`**
   - Explain that newly created repositories should normally be included automatically.
   - Re-check the repository list before asking the user to change settings.
   - If the new repo still does not appear, give the installation management link and ask them to verify the app is still set to **All repositories**.

5. **When the user says "done", "check", "try now", or similar**
   - Re-run the installation and repository checks immediately.
   - Report whether the repo is visible and whether push/write permission is available.
   - If it is writable, say it is ready for file creation, edits, commits, branches, issues, and pull requests.

## Safety and usability

- Never ask the user for a GitHub password, personal access token, SSH private key, or recovery code.
- Do not confuse OAuth authorization with GitHub App installation; both can exist separately.
- Do not tell the user a repository is connected based only on OAuth authorization.
- Keep setup guidance concise and give clickable links whenever possible.
- If the user has already selected **All repositories**, do not make them repeatedly reauthorize each newly created repo unless verification shows access is actually missing.

## Preferred response style

Be brief and action-oriented. Example:

> I checked. The GitHub App is authorized, but this repo is not visible yet. Open the connector settings here: [Manage GitHub App](https://github.com/settings/installations), add the repo, then tell me **check now**.

If no installation exists, use the direct install link instead.
