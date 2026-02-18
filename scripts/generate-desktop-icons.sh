#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ICON="${1:-${ROOT_DIR}/build/icon-source.png}"

if [[ ! -f "${SOURCE_ICON}" ]]; then
  echo "Source icon not found: ${SOURCE_ICON}" >&2
  echo "Usage: scripts/generate-desktop-icons.sh /path/to/source.png" >&2
  exit 1
fi

if ! command -v sips >/dev/null 2>&1; then
  echo "sips is required (macOS)" >&2
  exit 1
fi
if ! command -v iconutil >/dev/null 2>&1; then
  echo "iconutil is required (macOS)" >&2
  exit 1
fi
if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick (magick) is required" >&2
  exit 1
fi

mkdir -p "${ROOT_DIR}/build/icon.iconset"

# Normalize to a square 1024 base for all desktop formats.
magick "${SOURCE_ICON}" -background none -gravity center -extent 1024x1024 "${ROOT_DIR}/build/icon-1024.png"

sips -z 16 16     "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_16x16.png" >/dev/null
sips -z 32 32     "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_16x16@2x.png" >/dev/null
sips -z 32 32     "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_32x32.png" >/dev/null
sips -z 64 64     "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_32x32@2x.png" >/dev/null
sips -z 128 128   "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_128x128.png" >/dev/null
sips -z 256 256   "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_128x128@2x.png" >/dev/null
sips -z 256 256   "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_256x256.png" >/dev/null
sips -z 512 512   "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_256x256@2x.png" >/dev/null
sips -z 512 512   "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.iconset/icon_512x512.png" >/dev/null
cp "${ROOT_DIR}/build/icon-1024.png" "${ROOT_DIR}/build/icon.iconset/icon_512x512@2x.png"

iconutil -c icns "${ROOT_DIR}/build/icon.iconset" -o "${ROOT_DIR}/build/icon.icns"
magick "${ROOT_DIR}/build/icon-1024.png" -define icon:auto-resize=16,24,32,48,64,128,256 "${ROOT_DIR}/build/icon.ico"
sips -z 512 512 "${ROOT_DIR}/build/icon-1024.png" --out "${ROOT_DIR}/build/icon.png" >/dev/null

rm -f "${ROOT_DIR}/build/icon-1024.png"

echo "Generated icons:"
ls -lh "${ROOT_DIR}/build/icon.icns" "${ROOT_DIR}/build/icon.ico" "${ROOT_DIR}/build/icon.png"
