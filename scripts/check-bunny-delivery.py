#!/usr/bin/env python3
"""Read-only delivery audit. Outputs identifiers/statuses, never media URLs/keys."""
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bunny_audit", Path(__file__).with_name("bunny-drm.py"))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def main():
    env = dict(re.findall(r"(?m)^([A-Z_]+)=(.*)$", (audit.ROOT / ".env").read_text()))
    env = {k: v.strip().strip("\"'") for k, v in env.items()}
    env.update(os.environ)
    key = env["BUNNY_STREAM_API_KEY"]
    host = env["BUNNY_STREAM_CDN_HOSTNAME"]

    def probe(url, method="GET", referrer=True):
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or parsed.netloc != host:
            raise ValueError("Unexpected media host")
        req = urllib.request.Request(url, method=method,
            headers={"Referer": audit.REFERRER} if referrer else {})
        try:
            with urllib.request.build_opener(audit.NoRedirect).open(req, timeout=20) as response:
                return response.status, response.read(1_000_000).decode(errors="replace") if method == "GET" else ""
        except urllib.error.HTTPError as error:
            return error.code, ""

    videos = audit.request("video.bunnycdn.com", "/library/739542/videos", key)
    results = []
    for video in videos.get("items", []):
        vid = video["guid"]
        data = audit.request("video.bunnycdn.com", f"/library/739542/videos/{vid}/play", key)
        # Deliberately test the old unsigned URL, not a signed URL from /play.
        base = f"https://{host}/{vid}/"
        status, master = probe(base + "playlist.m3u8")
        playlists = [line.strip() for line in master.splitlines() if line.strip() and not line.startswith("#")]
        playlists += re.findall(r'URI="([^"]+\.m3u8[^\"]*)"', master)
        renditions = []
        for relative in dict.fromkeys(playlists):
            code, text = probe(urllib.parse.urljoin(base, relative))
            renditions.append({"http_status": code, "segment_count": text.count("#EXTINF:"),
                "key_methods": sorted(set(re.findall(r"METHOD=([^,\s]+)", text))),
                "key_formats": sorted(set(re.findall(r'KEYFORMAT="([^"]+)"', text)))})
        mp4s = {str(resolution): probe(base + f"play_{resolution}p.mp4", "HEAD")[0] for resolution in [360, 480, 720, 1080]}
        results.append({"video_id": vid, "playback": {k: data.get(k) for k in ["enableDRM", "drmVersion", "enableMP4Fallback", "tokenAuthEnabled"]},
            "unsigned_hls_status": status, "renditions": renditions, "old_mp4_statuses_with_production_referrer": mp4s,
            "old_mp4_no_referrer_status": probe(base + "play_360p.mp4", "HEAD", False)[0]})
    (audit.ROOT / "docs" / "bunny-delivery-verification.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"failed": True, "error_type": type(error).__name__, "http_status": getattr(error, "code", None)}))
        raise SystemExit(1)
