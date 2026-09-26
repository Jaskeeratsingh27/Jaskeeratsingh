import json
import time
import urllib.request
from datetime import datetime, timezone
from typing import Dict, Optional, Protocol

import jwt


class AuthError(RuntimeError):
    pass


class SecretStore(Protocol):
    def get(self, key: str) -> str: ...
    def set(self, key: str, value: str) -> None: ...


class MemorySecretStore:
    def __init__(self, values: Optional[Dict[str, str]] = None) -> None:
        self.values = dict(values or {})

    def get(self, key: str) -> str:
        try:
            return self.values[key]
        except KeyError as exc:
            raise AuthError(f"missing secret: {key}") from exc

    def set(self, key: str, value: str) -> None:
        self.values[key] = value


def _post_json(url: str, body: Dict[str, object], headers: Dict[str, str]) -> Dict[str, object]:
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json", **headers},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise AuthError(f"token request failed: {exc}") from exc


class GitHubAppTokenProvider:
    def __init__(
        self,
        app_id: str,
        installation_id: str,
        secrets: SecretStore,
        api_base: str = "https://api.github.com",
        time_fn=time.time,
    ) -> None:
        self.app_id = app_id
        self.installation_id = installation_id
        self.secrets = secrets
        self.api_base = api_base.rstrip("/")
        self.time_fn = time_fn
        self._token: Optional[str] = None
        self._expires_at = 0.0

    def invalidate(self) -> None:
        self._token = None
        self._expires_at = 0.0

    def _app_jwt(self) -> str:
        now = int(self.time_fn())
        private_key = self.secrets.get("GITHUB_APP_PRIVATE_KEY")
        return jwt.encode(
            {"iat": now - 60, "exp": now + 540, "iss": self.app_id},
            private_key,
            algorithm="RS256",
        )

    def get_token(self) -> str:
        if self._token and self.time_fn() < self._expires_at - 60:
            return self._token
        data = _post_json(
            f"{self.api_base}/app/installations/{self.installation_id}/access_tokens",
            {},
            {
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {self._app_jwt()}",
                "X-GitHub-Api-Version": "2026-03-10",
            },
        )
        token = str(data.get("token") or "")
        expires_at = str(data.get("expires_at") or "")
        if not token or not expires_at:
            raise AuthError("GitHub installation token response is incomplete")
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        self._token = token
        self._expires_at = expiry.astimezone(timezone.utc).timestamp()
        return token


class JiraOAuthTokenProvider:
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        secrets: SecretStore,
        token_url: str = "https://auth.atlassian.com/oauth/token",
        time_fn=time.time,
    ) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.secrets = secrets
        self.token_url = token_url
        self.time_fn = time_fn
        self._access_token: Optional[str] = None
        self._expires_at = 0.0

    def invalidate(self) -> None:
        self._access_token = None
        self._expires_at = 0.0

    def get_token(self) -> str:
        if self._access_token and self.time_fn() < self._expires_at - 60:
            return self._access_token

        refresh_token = self.secrets.get("JIRA_OAUTH_REFRESH_TOKEN")
        data = _post_json(
            self.token_url,
            {
                "grant_type": "refresh_token",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": refresh_token,
            },
            {},
        )
        access_token = str(data.get("access_token") or "")
        rotated_refresh = str(data.get("refresh_token") or "")
        expires_in = int(data.get("expires_in") or 0)
        if not access_token or not rotated_refresh or expires_in <= 0:
            raise AuthError("Jira OAuth refresh response is incomplete")

        # Atlassian refresh tokens rotate. Persist the replacement before
        # accepting the new access token as usable.
        self.secrets.set("JIRA_OAUTH_REFRESH_TOKEN", rotated_refresh)
        self._access_token = access_token
        self._expires_at = self.time_fn() + expires_in
        return access_token
