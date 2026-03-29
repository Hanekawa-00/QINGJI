import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.error) {
    console.error(`Command failed: ${command}`);
    console.error(result.error.message);
  }

  return result;
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

function findApkSigner() {
  const sdkRoot =
    process.env.ANDROID_SDK_ROOT ||
    process.env.ANDROID_HOME ||
    resolve(process.env.LOCALAPPDATA || "", "Android", "Sdk");

  const buildToolsDir = resolve(sdkRoot, "build-tools");
  if (!existsSync(buildToolsDir)) return null;

  const versions = readdirSync(buildToolsDir)
    .map((name) => ({
      name,
      path: join(buildToolsDir, name, process.platform === "win32" ? "apksigner.bat" : "apksigner")
    }))
    .filter((v) => existsSync(v.path))
    .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));

  return versions.length > 0 ? versions[0].path : null;
}

function findKeytool() {
  const candidates = [];
  if (process.env.JAVA_HOME) {
    candidates.push(
      join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "keytool.exe" : "keytool")
    );
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    candidates.push(
      join(localAppData, "Programs", "Android Studio", "jbr", "bin", "keytool.exe"),
      join(programFiles, "Android", "Android Studio", "jbr", "bin", "keytool.exe")
    );
  }

  const found = candidates.find((p) => p && existsSync(p));
  if (found) return found;
  return process.platform === "win32" ? "keytool.exe" : "keytool";
}

const input = getArg("--input");
const output = getArg("--output");

if (!input || !output) {
  console.error("Usage: node scripts/android-sign-apk.mjs --input <unsigned.apk> --output <signed.apk>");
  process.exit(1);
}

const inApk = resolve(process.cwd(), input);
const outApk = resolve(process.cwd(), output);
mkdirSync(resolve(outApk, ".."), { recursive: true });

if (!existsSync(inApk)) {
  console.error(`Input APK not found: ${inApk}`);
  process.exit(1);
}

const apksigner = findApkSigner();
if (!apksigner) {
  console.error("apksigner not found. Please install Android build-tools and set ANDROID_SDK_ROOT/ANDROID_HOME.");
  process.exit(1);
}

const keystore = resolve(process.env.USERPROFILE || process.env.HOME || "", ".android", "debug.keystore");
if (!existsSync(keystore)) {
  mkdirSync(resolve(keystore, ".."), { recursive: true });

  const keytoolCmd = findKeytool();
  const keytoolResult = runCommand(
    keytoolCmd,
    [
      "-genkeypair",
      "-v",
      "-keystore",
      keystore,
      "-storepass",
      "android",
      "-alias",
      "androiddebugkey",
      "-keypass",
      "android",
      "-keyalg",
      "RSA",
      "-keysize",
      "2048",
      "-validity",
      "10000",
      "-dname",
      "CN=Android Debug,O=Android,C=US"
    ]
  );

  if (keytoolResult.status !== 0 || !existsSync(keystore)) {
    if (keytoolResult.error) {
      console.error(`keytool execution error: ${keytoolResult.error.message}`);
      console.error(`keytool path used: ${keytoolCmd}`);
    }
    console.error(`Failed to create debug keystore: ${keystore}`);
    process.exit(keytoolResult.status ?? 1);
  }
}

const signResult = runCommand(
  apksigner,
  [
    "sign",
    "--ks",
    keystore,
    "--ks-key-alias",
    "androiddebugkey",
    "--ks-pass",
    "pass:android",
    "--key-pass",
    "pass:android",
    "--out",
    outApk,
    inApk
  ]
);

if (signResult.status !== 0) {
  process.exit(signResult.status ?? 1);
}

const verifyResult = runCommand(apksigner, ["verify", "--print-certs", outApk]);
if (verifyResult.status !== 0) {
  process.exit(verifyResult.status ?? 1);
}

console.log(`Signed APK created: ${outApk}`);
