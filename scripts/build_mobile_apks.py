#!/usr/bin/env python3
"""
SafeLink Mobile APK Builder Script
Automates the generation of official Android scaffolding, permissions injection,
background service manifest merging, core library desugaring, minSdkVersion alignment,
and Gradle compilation for both SafeLink mobile apps.
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
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.CALL_PHONE"/>

    <!-- Android 11+ package visibility for Google Maps navigation, web links, and 112 dialer -->
    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="http" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="geo" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="google.navigation" />
        </intent>
        <intent>
            <action android:name="android.intent.action.DIAL" />
            <data android:scheme="tel" />
        </intent>
    </queries>
"""

VOLUNTEER_SERVICE_BLOCK = """
        <service
            android:name="id.flutter.flutter_background_service.BackgroundService"
            android:foregroundServiceType="dataSync"
            android:exported="true"
            tools:replace="android:exported,android:foregroundServiceType" />
"""


def run_cmd(cmd, cwd=None):
    cmd_str = ' '.join(cmd) if isinstance(cmd, list) else cmd
    print(f"\n[RUNNING] {cmd_str} (in {cwd or '.'})", flush=True)
    sys.stdout.flush()
    sys.stderr.flush()
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        shell=isinstance(cmd, str),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        errors="replace",
    )
    lines = []
    assert proc.stdout is not None
    for line in proc.stdout:
        print(line, end="", flush=True)
        lines.append(line.rstrip("\r\n"))
    returncode = proc.wait()
    sys.stdout.flush()
    sys.stderr.flush()
    if returncode != 0:
        tail = [l for l in lines[-45:] if l.strip()]
        chunk = " | ".join(tail[-25:])
        print(f"::error::Command '{cmd_str}' failed (exit {returncode}): {chunk[:3500]}", flush=True)
        sys.exit(returncode)


def _patch_desugaring(bg_text: str, is_kts: bool) -> str:
    if is_kts:
        if "isCoreLibraryDesugaringEnabled" not in bg_text:
            if "compileOptions" in bg_text:
                bg_text = re.sub(
                    r"(compileOptions\s*\{)",
                    r"\1\n        isCoreLibraryDesugaringEnabled = true",
                    bg_text,
                    count=1,
                )
            else:
                bg_text = re.sub(
                    r"(android\s*\{)",
                    r"\1\n    compileOptions {\n        isCoreLibraryDesugaringEnabled = true\n        sourceCompatibility = JavaVersion.VERSION_1_8\n        targetCompatibility = JavaVersion.VERSION_1_8\n    }",
                    bg_text,
                    count=1,
                )
        if "desugar_jdk_libs" not in bg_text:
            if re.search(r"dependencies\s*\{", bg_text):
                bg_text = re.sub(
                    r"(dependencies\s*\{)",
                    r'\1\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")',
                    bg_text,
                    count=1,
                )
            else:
                bg_text += '\n\ndependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")\n}\n'
    else:
        if "coreLibraryDesugaringEnabled" not in bg_text:
            if "compileOptions" in bg_text:
                bg_text = re.sub(
                    r"(compileOptions\s*\{)",
                    r"\1\n        coreLibraryDesugaringEnabled true",
                    bg_text,
                    count=1,
                )
            else:
                bg_text = re.sub(
                    r"(android\s*\{)",
                    r"\1\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n        sourceCompatibility JavaVersion.VERSION_1_8\n        targetCompatibility JavaVersion.VERSION_1_8\n    }",
                    bg_text,
                    count=1,
                )
        if "desugar_jdk_libs" not in bg_text:
            if re.search(r"dependencies\s*\{", bg_text):
                bg_text = re.sub(
                    r"(dependencies\s*\{)",
                    r"\1\n    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.0.4'",
                    bg_text,
                    count=1,
                )
            else:
                bg_text += "\n\ndependencies {\n    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.0.4'\n}\n"
    return bg_text


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

    # 3. Inject mission-critical permissions, <queries>, tools namespace & background service into AndroidManifest.xml
    manifest_path = app_dir / "android" / "app" / "src" / "main" / "AndroidManifest.xml"
    if manifest_path.exists():
        manifest_text = manifest_path.read_text(encoding="utf-8")
        if "xmlns:tools" not in manifest_text:
            manifest_text = re.sub(
                r"<manifest\b",
                '<manifest xmlns:tools="http://schemas.android.com/tools"',
                manifest_text,
                count=1,
            )
        if "ACCESS_FINE_LOCATION" not in manifest_text:
            manifest_text = re.sub(
                r"(<manifest[^>]*>)",
                r"\1\n" + PERMISSIONS_BLOCK,
                manifest_text,
                count=1,
            )
        if "android:allowBackup" in manifest_text:
            manifest_text = re.sub(
                r'android:allowBackup\s*=\s*"[^"]*"',
                'android:allowBackup="false"',
                manifest_text,
            )
        else:
            manifest_text = manifest_text.replace(
                "<application",
                '<application\n        android:allowBackup="false"',
                1,
            )
        if app_name == "mobile_volunteer" and "id.flutter.flutter_background_service.BackgroundService" not in manifest_text:
            manifest_text = manifest_text.replace(
                "</application>",
                VOLUNTEER_SERVICE_BLOCK + "\n    </application>",
                1,
            )
        manifest_path.write_text(manifest_text, encoding="utf-8")
        print(f"[OK] Patched manifest permissions, queries & services in {manifest_path}")

    # Preserve notification/launcher icon resources during R8 shrinking
    keep_dir = app_dir / "android" / "app" / "src" / "main" / "res" / "raw"
    keep_dir.mkdir(parents=True, exist_ok=True)
    keep_file = keep_dir / "keep.xml"
    keep_file.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources xmlns:tools="http://schemas.android.com/tools"\n'
        '    tools:keep="@mipmap/ic_launcher,@drawable/*" />\n',
        encoding="utf-8",
    )

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

    # Patch build.gradle files for minSdk=21, desugaring (volunteer app), and debug signing
    for bg_file in [app_dir / "android" / "app" / "build.gradle", app_dir / "android" / "app" / "build.gradle.kts"]:
        if bg_file.exists():
            is_kts = bg_file.suffix == ".kts"
            bg_text = bg_file.read_text(encoding="utf-8")
            bg_text = re.sub(r"minSdk(Version)?\s*=\s*flutter\.minSdkVersion", "minSdk = 21", bg_text)
            bg_text = re.sub(r"minSdkVersion\s+flutter\.minSdkVersion", "minSdkVersion 21", bg_text)
            bg_text = re.sub(r"minSdkVersion\s+[0-9]+", "minSdkVersion 21", bg_text)
            if app_name == "mobile_volunteer":
                bg_text = _patch_desugaring(bg_text, is_kts=is_kts)
            if "signingConfigs.debug" not in bg_text:
                if is_kts:
                    bg_text = re.sub(r"(buildTypes\s*\{[\s\S]*?release\s*\{)", r'\1\n            signingConfig = signingConfigs.getByName("debug")', bg_text, count=1)
                else:
                    bg_text = re.sub(r"(buildTypes\s*\{[\s\S]*?release\s*\{)", r"\1\n            signingConfig signingConfigs.debug", bg_text, count=1)
            bg_file.write_text(bg_text, encoding="utf-8")
            print(f"[OK] Patched minSdk, desugaring, and signingConfig in {bg_file}")

    # 4.5. Align AGP (>=7.4.2 for desugar_jdk_libs 2.0.4) & Kotlin Gradle Plugin (1.9.24)
    for sg_file in [app_dir / "android" / "settings.gradle", app_dir / "android" / "settings.gradle.kts"]:
        if sg_file.exists():
            sg_text = sg_file.read_text(encoding="utf-8")
            sg_text = re.sub(r'id\s*\(?["\']com\.android\.application["\']\)?\s+version\s+["\']7\.[0-3]\.[0-9]+["\']', 'id "com.android.application" version "7.4.2"', sg_text)
            sg_text = re.sub(r'id\s*\(?["\']org\.jetbrains\.kotlin\.android["\']\)?\s+version\s+["\'][0-9.]+["\']', 'id "org.jetbrains.kotlin.android" version "1.9.24"', sg_text)
            sg_file.write_text(sg_text, encoding="utf-8")
            print(f"[OK] Patched AGP & kotlin version in {sg_file}")

    for root_bg in [app_dir / "android" / "build.gradle", app_dir / "android" / "build.gradle.kts"]:
        if root_bg.exists():
            rbg_text = root_bg.read_text(encoding="utf-8")
            rbg_text = re.sub(r'com\.android\.tools\.build:gradle:7\.[0-3]\.[0-9]+', 'com.android.tools.build:gradle:7.4.2', rbg_text)
            if "ext.kotlin_version" in rbg_text:
                rbg_text = re.sub(r"ext\.kotlin_version\s*=\s*['\"][0-9.]+['\"]", "ext.kotlin_version = '1.9.24'", rbg_text)
            else:
                rbg_text = "buildscript { ext.kotlin_version = '1.9.24' }\n" + rbg_text
            root_bg.write_text(rbg_text, encoding="utf-8")
            print(f"[OK] Patched kotlin version in {root_bg}")

    # 5. Get Flutter dependencies & validate Dart compilation
    run_cmd(["flutter", "pub", "get"], cwd=app_dir)
    run_cmd(["flutter", "analyze", "--no-fatal-infos", "--no-fatal-warnings"], cwd=app_dir)

    # 6. Build Release APK (lightweight, optimized, signed with debug keystore)
    print(f"\nCompiling Lightweight Release APK for {app_name}...", flush=True)
    run_cmd(["flutter", "build", "apk", "--release"], cwd=app_dir)

    # 7. Locate generated APK
    apk_candidates = (
        list(app_dir.glob("build/app/outputs/flutter-apk/*.apk"))
        or list(app_dir.glob("build/app/outputs/apk/release/*.apk"))
        or list(app_dir.glob("**/outputs/**/*.apk"))
        or list(app_dir.glob("**/*.apk"))
    )
    apk_candidates = [
        f for f in apk_candidates
        if f.is_file() and f.name.endswith(".apk") and not f.name.endswith("-unsigned.apk")
    ]
    if not apk_candidates:
        print(f"[FATAL] No APK found for {app_name}!", flush=True)
        build_folder = app_dir / "build"
        if build_folder.exists():
            print(f"Listing files in {build_folder}:", flush=True)
            for p in build_folder.rglob("*"):
                if p.is_file():
                    print(f"  {p.relative_to(app_dir)} ({p.stat().st_size} bytes)", flush=True)
        sys.exit(1)

    built_apk = apk_candidates[0]
    print(f"[OK] Built APK: {built_apk} ({built_apk.stat().st_size / (1024*1024):.2f} MB)", flush=True)

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
