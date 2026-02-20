#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <filename.png>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/artifacts/pos-sync/pos-sync-taxonomy-parity-v1/runtime/screens"
mkdir -p "$OUT_DIR"

FILE_NAME="$1"
if [[ "$FILE_NAME" != *.png ]]; then
  FILE_NAME="$FILE_NAME.png"
fi

OUT_PATH="$OUT_DIR/$FILE_NAME"
screencapture -x "$OUT_PATH"
echo "$OUT_PATH"
