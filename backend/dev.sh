#!/usr/bin/env bash
# ./dev.sh       啟動 dev server（跑在 venv 裡）
# source dev.sh  讓「目前這個終端機」進 venv
_here=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)

[ -d "$_here/.venv" ] || python3 -m venv "$_here/.venv"
source "$_here/.venv/bin/activate"
pip install -qr "$_here/requirements.txt" --disable-pip-version-check

# 被 source 時到此為止，不啟動 server
(return 0 2>/dev/null) && return

set -euo pipefail
cd "$_here"
exec uvicorn app.main:app --host 127.0.0.1 --port "${PORT:-8000}" --reload
