#!/usr/bin/env bash
# Dev server. uvicorn --reload watches the tree itself.
# First time: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
set -euo pipefail
cd "$(dirname "$0")"
exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "${PORT:-8000}" --reload
