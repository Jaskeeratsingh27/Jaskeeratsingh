---
name: github-access-helper
description: Help the user connect ChatGPT/Codex to GitHub, authorize repository access, verify whether the GitHub App can see and write to repositories, and provide the correct one-click setup or management link when access is missing. Trigger when the user asks to connect GitHub, authorize a repo, give ChatGPT access to a new repo, check GitHub access, fix missing repository access, or write/commit to GitHub.
---

# GitHub Access Helper

Use this workflow whenever the user wants ChatGPT or Codex to access, maintain, edit, or commit to GitHub repositories.

## Quick links for this account

The ChatGPT Codex Connector is already linked to the user's GitHub account. When repository authorization needs to be changed, give this link immediately:

**Manage / authorize repositories for the existing connector**
https://github.com/settings/installations/163378918

Use this generic fallback if the account-specific installation link stops working:
https://github.com/settings/installations

If the ChatGPT Codex Connector is ever not installed at all, use:
https://github.com/apps/chatgpt-codex-connector/installations/new

## Goal

Get the user from "GitHub is connected but the repo is not available" to verified repository access with the fewest possible steps.

## Workflow

1. **If the user asks for the GitHub authorization link**
   - Give the account-specific management link immediately:
     https://github.com/settings/installations/163378918
   - Tell them to open the ChatGPT Codex Connector, choose **All repositories** or add the specific repository, save the change, and then say **check now**.
   - Do not make them navigate through multiple settings screens when the direct link is available.

2. **Verify access**
   - Check the authenticated GitHub profile.
   - Check GitHub App installations.
   - List accessible repositories.
   - Do not claim write access until the target repository is visible and its permissions show push/write access.

3. **If the ChatGPT Codex Connector is not installed**
   Give the user this direct installation link:
   https://github.com/apps/chatgpt-codex-connector/installations/new

   Tell them to:
   - choose the GitHub account,
   - select **All repositories** or the repositories they want ChatGPT to access,
   - complete the installation,
   - then return and say **check now**.

4. **If the connector is installed but the target repo is missing**
   - Give the account-specific management link first:
     https://github.com/settings/installations/163378918
   - Tell the user to open the ChatGPT Codex Connector configuration and add the repository, or switch to **All repositories**.
   - If that installation link no longer resolves, use the current installation's `html_url` returned by the GitHub tool.
   - Final fallback:
     https://github.com/settings/installations

5. **If repository_selection is `all`**
   - Explain that newly created repositories should normally be included automatically.
   - Re-check the repository list before asking the user to change settings.
   - If the new repo still does not appear, give the account-specific management link and ask them to verify the app is still set to **All repositories**.

6. **When the user says "done", "check", "try now", or similar**
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

Be brief and action-oriented. When the connector is already installed but repository access needs attention, use:

> Open your existing ChatGPT Codex Connector here: [Manage GitHub repository access](https://github.com/settings/installations/163378918). Add the repo or choose **All repositories**, save it, then tell me **check now**.

If no installation exists, use the direct install link instead.
