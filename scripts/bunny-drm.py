#!/usr/bin/env python3
"""Current-library security rollout. Never prints keys, signed URLs, or raw API bodies.

inspect: read-only. prepare: disable clear delivery features and install the
separate token key locally. activate-free-auth: enable official embed-view token
authentication without Enterprise DRM. activate-auth: AFTER Enterprise
provisioning and application deployment, enable DRM-compatible authentication.
No command purchases DRM, changes DRM version, deletes media, or reprocesses it.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
LIBRARY = 739542
REFERRER = "https://arabautomators.com/"
SAFE_FIELDS = ["Id", "Name", "PullZoneId", "EnableDRM", "DrmVersion", "EnableMP4Fallback",
               "AllowDirectPlay", "ExposeOriginals", "KeepOriginalFiles", "AllowEarlyPlay",
               "PlayerTokenAuthenticationEnabled", "AllowedReferrers", "BlockNoneReferrer",
               "GoogleWidevineDrm", "AppleFairPlayDrm"]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class AuditFailure(Exception):
    """Only fixed, credential-free diagnostic messages belong in this exception."""


def request(host, path, key, payload=None):
    req = urllib.request.Request("https://" + host + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"AccessKey": key, "Content-Type": "application/json", "Referer": REFERRER},
        method="POST" if payload is not None else "GET")
    with urllib.request.build_opener(NoRedirect).open(req, timeout=25) as res:
        body = res.read()
        return json.loads(body) if body else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["inspect", "prepare", "activate-free-auth", "activate-auth"])
    args = parser.parse_args()
    env_path = ROOT / ".env"
    env_text = env_path.read_text()
    env = dict(re.findall(r"(?m)^([A-Z_]+)=(.*)$", env_text))
    env = {k: v.strip().strip("\"'") for k, v in env.items()}
    env.update(os.environ)
    if env.get("BUNNY_STREAM_LIBRARY_ID") != str(LIBRARY):
        raise AuditFailure("Unexpected library")
    account_key = env["BUNNY_ACCOUNT_API_KEY"]
    stream_key = env["BUNNY_STREAM_API_KEY"]
    path = f"/videolibrary/{LIBRARY}"
    library = request("api.bunny.net", path, account_key)
    zone = request("api.bunny.net", f"/pullzone/{library['PullZoneId']}", account_key)
    before = {k: library.get(k) for k in SAFE_FIELDS}
    payload = {}
    if args.action in ("prepare", "activate-free-auth", "activate-auth"):
        if library.get("AllowedReferrers") != ["arabautomators.com"]:
            raise AuditFailure("Review production referrer allowlist before applying")
        desired = {"EnableMP4Fallback": False, "AllowDirectPlay": False,
                   "ExposeOriginals": False, "AllowEarlyPlay": False,
                   "KeepOriginalFiles": True, "BlockNoneReferrer": True}
        payload = {k: v for k, v in desired.items() if library.get(k) != v}
    if args.action == "activate-free-auth":
        payload["PlayerTokenAuthenticationEnabled"] = True
    if args.action == "activate-auth":
        if not (library.get("EnableDRM") is True and library.get("DrmVersion") == 1 and
                library.get("GoogleWidevineDrm", {}).get("Enabled") is True and
                library.get("AppleFairPlayDrm", {}).get("Enabled") is True):
            raise AuditFailure("Enterprise provisioning and both providers must be active first")
        # The previous deployment has no playback API; refuse to lock it out.
        test_path = "/api/course/00000000-0000-0000-0000-000000000000/videos/00000000-0000-0000-0000-000000000000/playback"
        try:
            urllib.request.build_opener(NoRedirect).open(REFERRER.rstrip("/") + test_path, timeout=15)
            raise AuditFailure("Playback API unexpectedly allowed an unauthenticated request")
        except urllib.error.HTTPError as err:
            if err.code != 401:
                raise AuditFailure("Deploy the protected playback API before enabling embed authentication") from None
        if not library.get("PlayerTokenAuthenticationEnabled"):
            payload["PlayerTokenAuthenticationEnabled"] = True
        if not zone.get("ZoneSecurityEnabled"):
            payload["EnableTokenAuthentication"] = True
        if not library.get("GoogleWidevineDrm", {}).get("SdOnlyForL3"):
            payload["GoogleWidevineDrm"] = {"SdOnlyForL3": True}

    if payload:
        # Bunny's documented update uses POST with optional fields, not full PUT.
        request("api.bunny.net", path, account_key, payload)
        after = request("api.bunny.net", path, account_key)
        zone_after = request("api.bunny.net", f"/pullzone/{library['PullZoneId']}", account_key)
        for name, expected in payload.items():
            actual = zone_after.get("ZoneSecurityEnabled") if name == "EnableTokenAuthentication" else after.get(name)
            if isinstance(expected, dict):
                if not all((actual or {}).get(k) == v for k, v in expected.items()):
                    raise AuditFailure("Nested configuration read-back mismatch")
            elif actual != expected:
                raise AuditFailure("Configuration read-back mismatch")
        # Compare all unchanged library fields in memory, without printing values.
        volatile = {"DateModified", "TrafficUsage", "StorageUsage", "VideoCount"}
        unexpected = [k for k in library if k not in payload and k not in volatile and library[k] != after.get(k)]
        if unexpected:
            print(json.dumps({"unexpected_changed_field_names": unexpected}))
            raise AuditFailure("Unrelated library fields changed; review before proceeding")
        library, zone = after, zone_after

    token_installed = False
    if args.action == "prepare":
        key = zone.get("ZoneSecurityKey")
        if not isinstance(key, str) or not key or not re.fullmatch(r"[A-Za-z0-9_-]+", key):
            raise AuditFailure("Token security key unavailable or unexpected format")
        line = "BUNNY_STREAM_TOKEN_SECURITY_KEY=" + key
        if re.search(r"(?m)^BUNNY_STREAM_TOKEN_SECURITY_KEY=", env_text):
            env_text = re.sub(r"(?m)^BUNNY_STREAM_TOKEN_SECURITY_KEY=.*$", lambda _: line, env_text)
        else:
            env_text = env_text.rstrip("\n") + "\n" + line + "\n"
        temporary = env_path.with_name(".env.drm-tmp")
        with os.fdopen(os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w") as output:
            output.write(env_text)
        temporary.replace(env_path)
        token_installed = True

    videos = request("video.bunnycdn.com", f"/library/{LIBRARY}/videos?page=1&itemsPerPage=100", stream_key)
    measurements = []
    for video in videos.get("items", []):
        vid = video["guid"]
        data = request("video.bunnycdn.com", f"/library/{LIBRARY}/videos/{vid}/play", stream_key)
        measurements.append({"id": vid, "status": video.get("status"), "hasOriginal": video.get("hasOriginal"),
            "hasMP4Fallback": video.get("hasMP4Fallback"),
            "playback": {k: data.get(k) for k in ["enableDRM", "drmVersion", "enableMP4Fallback", "allowEarlyPlay", "tokenAuthEnabled"]}})
    result = {"recorded_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "action": args.action,
              "updated_fields": payload, "token_key_installed_locally": token_installed,
              "before": before, "after": {k: library.get(k) for k in SAFE_FIELDS},
              "cdn": {k: zone.get(k) for k in ["Id", "ZoneSecurityEnabled", "ZoneSecurityIncludeHashRemoteIP", "BlockNoneReferrer"]},
              "videos": measurements, "reprocessing_performed": False}
    (ROOT / "docs" / "bunny-enterprise-drm-state.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Do not include URLs, exception strings or upstream response bodies.
        print(json.dumps({"failed": True, "error_type": type(error).__name__, "http_status": getattr(error, "code", None),
                          "reason": str(error) if isinstance(error, AuditFailure) else "Request or local configuration failed; details withheld."}))
        raise SystemExit(1)
