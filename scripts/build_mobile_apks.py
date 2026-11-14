#!/usr/bin/env python3
"""
SafeLink Mobile APK Builder Script
Automates the generation of official Android scaffolding, permissions injection,
minSdkVersion alignment, and Gradle compilation for both SafeLink mobile apps.
"""

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

PERMISSIONS_BLOCK = """
    <!-- Mission-critical permissions for SafeLink Emergency Response -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.CALL_PHONE"/>
"""


def run_cmd(cmd, cwd=None):
    cmd_str = ' '.join(cmd) if isinstance(cmd, list) else cmd
    print(f"\n[RUNNING] {cmd_str} (in {cwd or '.'})", flush=True)
    sys.stdout.flush()
    sys.stderr.flush()
    res = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str))
    sys.stdout.flush()
    sys.stderr.flush()
    if res.returncode != 0:
        print(f"[ERROR] Command '{cmd_str}' failed with exit code {res.returncode}", flush=True)
        sys.exit(res.returncode)


def build_app(app_name, package_name, output_apk_name):
    app_dir = ROOT_DIR / "apps" / app_name
    print(f"\n==========================================", flush=True)
    print(f" BUILDING {app_name.upper()} ({package_name})", flush=True)
    print(f"==========================================", flush=True)

    # 1. Clean existing android folder to avoid scaffolding conflict
    android_dir = app_dir / "android"
    if android_dir.exists():
        print(f"Removing partial android directory in {app_dir}...")
        shutil.rmtree(android_dir)

    # Backup pubspec.yaml before flutter create so all custom packages and dependencies are preserved
    pubspec_path = app_dir / "pubspec.yaml"
    pubspec_content = pubspec_path.read_text(encoding="utf-8") if pubspec_path.exists() else None

    # 2. Scaffold clean Android project with Flutter
    run_cmd(["flutter", "create", "--org", "com.safelink", "--project-name", app_name, "--platforms=android", "."], cwd=app_dir)

    # Restore pubspec.yaml
    if pubspec_content:
        pubspec_path.write_text(pubspec_content, encoding="utf-8")
        print(f"[OK] Preserved original pubspec.yaml for {app_name}")

    # 3. Inject mission-critical permissions into generated AndroidManifest.xml
    manifest_path = app_dir / "android" / "app" / "src" / "main" / "AndroidManifest.xml"
    if manifest_path.exists():
        manifest_text = manifest_path.read_text(encoding="utf-8")
        if "ACCESS_FINE_LOCATION" not in manifest_text:
            manifest_text = re.sub(
                r"(<manifest[^>]*>)",
                r"\1\n" + PERMISSIONS_BLOCK,
                manifest_text,
                count=1,
            )
            manifest_path.write_text(manifest_text, encoding="utf-8")
            print(f"[OK] Injected emergency permissions into {manifest_path}")

    # 4. Configure local.properties with sdk.dir and flutter.minSdkVersion
    android_sdk = (
        os.environ.get("ANDROID_HOME")
        or os.environ.get("ANDROID_SDK_ROOT")
        or "/usr/local/lib/android/sdk"
    )
    local_props = app_dir / "android" / "local.properties"
    props_lines = []
    if local_props.exists():
        props_lines = [
            l for l in local_props.read_text(encoding="utf-8").splitlines()
            if not l.startswith("flutter.minSdkVersion")
        ]
    if not any(l.startswith("sdk.dir") for l in props_lines) and os.path.exists(android_sdk):
        props_lines.append(f"sdk.dir={android_sdk}")
    props_lines.append("flutter.minSdkVersion=21")
    local_props.write_text("\n".join(props_lines) + "\n", encoding="utf-8")
    print(f"[OK] Configured local.properties in {local_props}:\n{local_props.read_text(encoding='utf-8')}")

    # Also patch build.gradle files if minSdk is explicitly referenced
    for bg_file in [app_dir / "android" / "app" / "build.gradle", app_dir / "android" / "app" / "build.gradle.kts"]:
        if bg_file.exists():
            bg_text = bg_file.read_text(encoding="utf-8")
            bg_text = re.sub(r"minSdk(Version)?\s*=\s*flutter\.minSdkVersion", "minSdk = 21", bg_text)
            bg_text = re.sub(r"minSdkVersion\s+flutter\.minSdkVersion", "minSdkVersion 21", bg_text)
            bg_text = re.sub(r"minSdkVersion\s+[0-9]+", "minSdkVersion 21", bg_text)
            bg_file.write_text(bg_text, encoding="utf-8")
            print(f"[OK] Patched minSdk in {bg_file}")

    # 5. Get Flutter dependencies
    run_cmd(["flutter", "pub", "get"], cwd=app_dir)

    # 6. Build APK
    # --debug builds a universally signed, easily installable APK with zero keystore setup required
    print(f"\nCompiling APK for {app_name}...", flush=True)
    run_cmd(["flutter", "build", "apk", "--debug"], cwd=app_dir)

    # 7. Locate generated APK
    outputs_dir = app_dir / "build" / "app" / "outputs" / "flutter-apk"
    apk_candidates = list(outputs_dir.glob("*.apk"))
    if not apk_candidates:
        print(f"[FATAL] No APK found in {outputs_dir}!")
        sys.exit(1)

    built_apk = apk_candidates[0]
    print(f"[OK] Built APK: {built_apk} ({built_apk.stat().st_size / (1024*1024):.2f} MB)")

    # 8. Copy to dist-apks and web downloads
    dist_dir = ROOT_DIR / "dist-apks"
    dist_dir.mkdir(parents=True, exist_ok=True)
    target_dist = dist_dir / output_apk_name
    shutil.copy2(built_apk, target_dist)

    web_downloads = ROOT_DIR / "apps" / "web" / "public" / "downloads"
    web_downloads.mkdir(parents=True, exist_ok=True)
    target_web = web_downloads / output_apk_name
    shutil.copy2(built_apk, target_web)
    print(f"[OK] Copied {output_apk_name} to {target_web} ({target_web.stat().st_size / (1024*1024):.2f} MB)")


def main():
    shared_dart = ROOT_DIR / "packages" / "shared_dart"
    print(f"Preparing shared_dart at {shared_dart}...")
    run_cmd(["flutter", "pub", "get"], cwd=shared_dart)

    build_app("mobile_women", "com.safelink.women", "safelink-women.apk")
    build_app("mobile_volunteer", "com.safelink.volunteer", "safelink-volunteer.apk")

    print("\n==========================================")
    print(" ALL APKS BUILT & DEPLOYED SUCCESSFULLY! ")
    print("==========================================")


if __name__ == "__main__":
    main()
