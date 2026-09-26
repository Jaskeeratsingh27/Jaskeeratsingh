import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Dict, Optional

from provider_auth import GitHubAppTokenProvider, JiraOAuthTokenProvider


class ProviderError(RuntimeError):
    def __init__(self, message: str, status: Optional[int] = None, retryable: bool = False):
        super().__init__(message)
        self.status = status
        self.retryable = retryable


def _request_json(
    method: str,
    url: str,
    headers: Dict[str, str],
    body: Optional[Dict[str, object]] = None,
) -> Dict[str, object]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", **headers},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read()
            return json.loads(raw.decode("utf-8")) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        retryable = exc.code == 429 or 500 <= exc.code <= 599
        raise ProviderError(
            f"{method} {url} failed: {exc.code} {raw}",
            status=exc.code,
            retryable=retryable,
        ) from exc
    except OSError as exc:
        raise ProviderError(str(exc), retryable=True) from exc


class JiraClient:
    def __init__(
        self,
        cloud_id: str,
        token_provider: JiraOAuthTokenProvider,
        api_base: str = "https://api.atlassian.com",
    ) -> None:
        self.cloud_id = cloud_id
        self.token_provider = token_provider
        self.base = f"{api_base.rstrip('/')}/ex/jira/{cloud_id}/rest/api/3"

    def _request(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, object]] = None,
        retry_auth: bool = True,
    ) -> Dict[str, object]:
        try:
            return _request_json(
                method,
                f"{self.base}{path}",
                {
                    "Accept": "application/json",
                    "Authorization": f"Bearer {self.token_provider.get_token()}",
                },
                body,
            )
        except ProviderError as exc:
            if exc.status == 401 and retry_auth:
                self.token_provider.invalidate()
                return self._request(method, path, body, retry_auth=False)
            raise

    def set_status(self, issue_key: str, target_status: str) -> None:
        issue = self._request("GET", f"/issue/{urllib.parse.quote(issue_key)}?fields=status")
        current = str(((issue.get("fields") or {}).get("status") or {}).get("name") or "")
        if current.casefold() == target_status.casefold():
            return

        transitions = self._request(
            "GET",
            f"/issue/{urllib.parse.quote(issue_key)}/transitions",
        )
        matches = [
            item for item in transitions.get("transitions", [])
            if str(item.get("name") or "").casefold() == target_status.casefold()
        ]
        if not matches:
            raise ProviderError(
                f"no Jira transition to {target_status!r} for {issue_key}",
                retryable=False,
            )
        self._request(
            "POST",
            f"/issue/{urllib.parse.quote(issue_key)}/transitions",
            {"transition": {"id": str(matches[0]["id"])}},
        )

    def add_label(self, issue_key: str, label: str) -> None:
        self._request(
            "PUT",
            f"/issue/{urllib.parse.quote(issue_key)}",
            {"update": {"labels": [{"add": label}]}},
        )

    def remove_label(self, issue_key: str, label: str) -> None:
        self._request(
            "PUT",
            f"/issue/{urllib.parse.quote(issue_key)}",
            {"update": {"labels": [{"remove": label}]}},
        )


class GitHubClient:
    def __init__(
        self,
        token_provider: GitHubAppTokenProvider,
        api_base: str = "https://api.github.com",
    ) -> None:
        self.token_provider = token_provider
        self.api_base = api_base.rstrip("/")

    def get_repository(self, owner: str, repo: str) -> Dict[str, object]:
        path = f"/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}"
        try:
            return _request_json(
                "GET",
                f"{self.api_base}{path}",
                {
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {self.token_provider.get_token()}",
                    "X-GitHub-Api-Version": "2026-03-10",
                },
            )
        except ProviderError as exc:
            if exc.status == 401:
                self.token_provider.invalidate()
            raise
