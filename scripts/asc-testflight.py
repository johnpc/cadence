#!/usr/bin/env python3
"""App Store Connect API helper for the iOS deploy (TestFlight only — never App Store
submission, which stays manual).

  asc-testflight.py builds [N]          list the N most recent builds (read-only)
  asc-testflight.py distribute <BUILD>  confirm build <BUILD> (CFBundleVersion) ARRIVED
                                        in App Store Connect, wait for processing, then
                                        attach it to every external beta group

Env: ASC_KEY_ID, ASC_ISSUER_ID, BUNDLE_ID; key at ~/private_keys/AuthKey_<id>.p8.
Optional: ASC_ARRIVAL_MINUTES (default 10), ASC_PROCESSING_MINUTES (default 45).

Every failure names its cause and exits non-zero. The waits are explicit deadlines
with a status line per poll (flushed, so the CI log is live), and every HTTP call has
a timeout — nothing here can hang silently. No retries: a failed call is reported.
"""
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

BASE = "https://api.appstoreconnect.apple.com/v1"
POLL_SECS = 30


def log(msg):
    print(msg, flush=True)


def die(msg):
    log(f"::error::{msg}")
    sys.exit(1)


def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def der_int(data, offset):
    assert data[offset] == 0x02
    length = data[offset + 1]
    value = data[offset + 2:offset + 2 + length].lstrip(b"\x00")
    return value.rjust(32, b"\x00"), offset + 2 + length


def token():
    key_id, issuer = os.environ["ASC_KEY_ID"], os.environ["ASC_ISSUER_ID"]
    key_path = os.path.expanduser(f"~/private_keys/AuthKey_{key_id}.p8")
    header = b64url(json.dumps({"alg": "ES256", "kid": key_id, "typ": "JWT"}).encode())
    now = int(time.time())
    claims = {"iss": issuer, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"}
    signing_input = f"{header}.{b64url(json.dumps(claims).encode())}"
    with tempfile.NamedTemporaryFile(suffix=".bin") as tf:
        tf.write(signing_input.encode())
        tf.flush()
        res = subprocess.run(["openssl", "dgst", "-sha256", "-sign", key_path, tf.name], capture_output=True)
    if res.returncode != 0:
        die(f"could not sign the ASC token with {key_path}: {res.stderr.decode().strip()}")
    der = res.stdout
    r, off = der_int(der, 2)
    s, _ = der_int(der, off)
    return f"{signing_input}.{b64url(r + s)}"


def api(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, method=method, headers={
        "Authorization": f"Bearer {token()}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        die(f"App Store Connect answered HTTP {e.code} on {method} {path}: {e.read().decode()[:800]}")
    except (urllib.error.URLError, TimeoutError) as e:
        die(f"App Store Connect unreachable on {method} {path}: {e}")


def app_id():
    bundle = os.environ["BUNDLE_ID"]
    apps = api(f"/apps?filter[bundleId]={bundle}").get("data", [])
    if not apps:
        die(f"no App Store Connect app for bundle id {bundle}")
    return apps[0]["id"]


def find_build(app, build_num):
    builds = api(f"/builds?filter[app]={app}&filter[version]={build_num}&limit=1").get("data", [])
    return builds[0] if builds else None


def cmd_builds(limit="10"):
    app = app_id()
    for u in api(f"/apps/{app}/buildUploads?limit={int(limit)}").get("data", []):
        a = u["attributes"]
        log(f"upload {a.get('cfBundleVersion')}  {(a.get('state') or {}).get('state'):<9} "
            f"uploaded {a.get('uploadedDate')}  {'; '.join(upload_problems(u))}")
    for b in api(f"/builds?filter[app]={app}&sort=-uploadedDate&limit={int(limit)}").get("data", []):
        a = b["attributes"]
        log(f"build  {a.get('version')}  {a.get('processingState'):<11} uploaded {a.get('uploadedDate')}  "
            f"expired={a.get('expired')}")


def find_upload(app, build_num):
    """The buildUpload record for this CFBundleVersion: Apple's own account of the
    delivery (state AWAITING_UPLOAD/PROCESSING/COMPLETE/FAILED + errors), which exists
    before the build record does — so a rejected binary is named, not timed out on."""
    uploads = api(f"/apps/{app}/buildUploads?limit=50").get("data", [])
    return next((u for u in uploads if u["attributes"].get("cfBundleVersion") == build_num), None)


def upload_problems(upload):
    st = upload["attributes"].get("state") or {}
    return [f"{e.get('code', '')}: {e.get('description') or e.get('message') or e}" for e in st.get("errors") or []]


def wait_for_build(app, build_num):
    """Deadlines: the upload must be on record within ASC_ARRIVAL_MINUTES (default 10)
    and the build VALID within ASC_PROCESSING_MINUTES (default 45). Apple has taken
    >20 min to list a fine build (20261108114205), so a short budget is a false red."""
    t0 = time.time()
    arrival = t0 + 60 * int(os.environ.get("ASC_ARRIVAL_MINUTES", "10"))
    processing_min = int(os.environ.get("ASC_PROCESSING_MINUTES", "45"))
    processing = t0 + 60 * processing_min
    upload_seen = False
    while True:
        elapsed = f"{int(time.time() - t0)}s"
        build = find_build(app, build_num)
        if build is not None:
            state = build["attributes"].get("processingState")
            log(f"  [{elapsed}] build {build_num}: {state}")
            if state == "VALID":
                return build
            if state in ("INVALID", "FAILED"):
                die(f"App Store Connect processing of build {build_num} ended {state} — the reason is on the "
                    "TestFlight build page and in Apple's email to the account holder.")
        else:
            upload = find_upload(app, build_num)
            if upload is None:
                if time.time() > arrival:
                    die(f"App Store Connect has no upload of build {build_num} although xcodebuild finished — "
                        "the delivery never reached Apple (see the ContentDelivery / IDEDistribution logs above).")
                log(f"  [{elapsed}] build {build_num}: no upload on record yet")
            else:
                upload_seen = True
                state = (upload["attributes"].get("state") or {}).get("state")
                problems = upload_problems(upload)
                if state == "FAILED" or problems:
                    die(f"Apple rejected the upload of build {build_num} ({state}): " + "; ".join(problems))
                log(f"  [{elapsed}] build {build_num}: upload {state}, build record not listed yet")
        if time.time() > processing:
            where = "uploaded but not yet VALID" if (build or upload_seen) else "not on record"
            die(f"build {build_num} is {where} after {processing_min} min — Apple processing is slow or stuck. "
                "It may still finish (check TestFlight); this run cannot distribute it.")
        time.sleep(POLL_SECS)


def cmd_distribute(build_num):
    app = app_id()
    build = wait_for_build(app, build_num)
    groups = [g for g in api(f"/betaGroups?filter[app]={app}&limit=200").get("data", [])
              if not g["attributes"].get("isInternalGroup", False)]
    if not groups:
        log(f"build {build_num} is VALID in TestFlight; no external beta group exists — create an External "
            "Testing group in App Store Connect to auto-distribute.")
        return
    for g in groups:
        api(f"/betaGroups/{g['id']}/relationships/builds", method="POST",
            body={"data": [{"type": "builds", "id": build["id"]}]})
        log(f"  attached build {build_num} to external group '{g['attributes'].get('name', g['id'])}'")
    log(f"Done: build {build_num} is in TestFlight and distributed to {len(groups)} external group(s).")


if __name__ == "__main__":
    cmds = {"builds": cmd_builds, "distribute": cmd_distribute}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        die(__doc__)
    cmds[sys.argv[1]](*sys.argv[2:])
