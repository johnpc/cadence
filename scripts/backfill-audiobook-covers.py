#!/usr/bin/env python3
"""One-off: backfill Primary cover art for AudioBook items that have none.

Finds a REAL cover via the iTunes Search API (audiobook → ebook → music), and
uploads it to every part of the book via the Jellyfin image API (so it shows in
ALL clients, not just Cadence). Books with no real cover found are printed at the
end as the nano-banana fallback queue. Idempotent: skips items that already have
Primary art. Read-only to files — only sets the Jellyfin-side image.

Env: JELLYFIN_API_KEY (admin), JELLYFIN_URL (default https://jellyfin.jpc.io).
"""
import os, re, sys, json, base64, urllib.request, urllib.parse
from collections import defaultdict

KEY = os.environ["JELLYFIN_API_KEY"]
JURL = os.environ.get("JELLYFIN_URL", "https://jellyfin.jpc.io").rstrip("/")


def jf(path, method="GET", data=None, ctype="application/json"):
    req = urllib.request.Request(
        JURL + path, data=data, method=method,
        headers={"X-Emby-Token": KEY, "Content-Type": ctype},
    )
    return urllib.request.urlopen(req, timeout=90)


def admin_id():
    users = json.load(jf("/Users"))
    return next(u["Id"] for u in users if u["Name"] == "John")


def all_books(uid):
    q = urllib.parse.urlencode({
        "IncludeItemTypes": "AudioBook", "Recursive": "true", "Limit": "5000",
        "Fields": "Album,AlbumArtist,Artists", "userId": uid,
    })
    return json.load(jf(f"/Items?{q}"))["Items"]


def stem(n):
    return re.sub(r"[-_]?\s*(part|chapter|disc|cd|track)?\s*\d+.*$", "", n, flags=re.I).strip()


def clean_title(s):
    s = re.sub(r"\s*\((un)?abridged\)\s*$", "", s, flags=re.I)
    s = re.sub(r"^\s*\d+\s*[-._]?\s+", "", s)
    # Drop a leading "Author - " lead-in some filenames carry.
    return s.strip()


def itunes_cover(term):
    for media in ("audiobook", "ebook", "music"):
        u = "https://itunes.apple.com/search?" + urllib.parse.urlencode(
            {"term": term, "media": media, "limit": 1}
        )
        try:
            r = json.load(urllib.request.urlopen(u, timeout=20)).get("results", [])
        except Exception:
            r = []
        if r and r[0].get("artworkUrl100"):
            return r[0]["artworkUrl100"].replace("100x100", "600x600")
    return None


def upload(iid, img):
    try:
        jf(f"/Items/{iid}/Images/Primary", method="POST", data=base64.b64encode(img), ctype="image/jpeg")
        return True
    except Exception as e:
        print(f"    upload {iid} FAILED: {e}")
        return False


def main():
    uid = admin_id()
    items = all_books(uid)
    noart = [it for it in items if not it.get("ImageTags", {}).get("Primary")]
    groups = defaultdict(list)
    for it in noart:
        key = it.get("Album") or stem(it["Name"])
        groups[key].append(it)
    print(f"art-less logical books: {len(groups)}")
    missing = []
    for key, parts in groups.items():
        title = clean_title(key)
        author = parts[0].get("AlbumArtist") or (parts[0].get("Artists") or [""])[0] or ""
        author = author.split(",")[0]
        term = f"{title} {author}".strip()
        art = itunes_cover(term) or itunes_cover(title)
        if not art:
            missing.append((title, author, [p["Id"] for p in parts]))
            print(f"  MISS  {title!r} (author {author!r}) — no real cover")
            continue
        img = urllib.request.urlopen(art, timeout=25).read()
        ok = sum(upload(p["Id"], img) for p in parts)
        print(f"  OK    {title!r}: cover on {ok}/{len(parts)} parts")
    print("\n=== nano-banana queue (no real cover found) ===")
    for t, a, ids in missing:
        print(json.dumps({"title": t, "author": a, "ids": ids}))


if __name__ == "__main__":
    main()
