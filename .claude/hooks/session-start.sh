#!/bin/bash
# Prepara a sessão na nuvem: Blender, VoiceStudio, pacotes Python das skills
# e as dependências do projeto inferno-dante. Pode rodar várias vezes.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

BLENDER_SERIES="5.2"
BLENDER_VERSION="5.2.2"
BLENDER_DIR="/opt/blender/blender-${BLENDER_VERSION}-linux-x64"

VOICESTUDIO_DIR="/opt/voicestudio"
VOICESTUDIO_COMMIT="28bf2c7a83b8a64836297340c52a45d716684aed"

log() { echo "[session-start] $*" >&2; }

# --- Blender (tarball oficial, conferido pelo sha256) ---------------------
if [ ! -x "$BLENDER_DIR/blender" ]; then
  log "Instalando Blender ${BLENDER_VERSION}..."
  base="https://download.blender.org/release/Blender${BLENDER_SERIES}"
  tarball="blender-${BLENDER_VERSION}-linux-x64.tar.xz"
  tmp="$(mktemp -d)"
  curl -sSfL "$base/$tarball" -o "$tmp/$tarball"
  curl -sSfL "$base/blender-${BLENDER_VERSION}.sha256" -o "$tmp/sums.txt"
  (cd "$tmp" && grep " $tarball\$" sums.txt | sha256sum -c -)
  mkdir -p /opt/blender
  tar xf "$tmp/$tarball" -C /opt/blender
  rm -rf "$tmp"
fi
ln -sf "$BLENDER_DIR/blender" /usr/local/bin/blender

# --- VoiceStudio (backend, PyTorch para CPU) -------------------------------
if [ ! -d "$VOICESTUDIO_DIR/.git" ]; then
  log "Baixando VoiceStudio..."
  git clone -q https://github.com/debpalash/VoiceStudio "$VOICESTUDIO_DIR"
fi
if [ "$(git -C "$VOICESTUDIO_DIR" rev-parse HEAD)" != "$VOICESTUDIO_COMMIT" ]; then
  git -C "$VOICESTUDIO_DIR" fetch -q origin "$VOICESTUDIO_COMMIT" 2>/dev/null \
    || git -C "$VOICESTUDIO_DIR" fetch -q origin
  git -C "$VOICESTUDIO_DIR" checkout -q "$VOICESTUDIO_COMMIT"
fi
log "Sincronizando dependências do VoiceStudio..."
(cd "$VOICESTUDIO_DIR" && OMNIVOICE_TORCH_VARIANT=cpu uv sync --locked --no-group cuda --group cpu -q)

# --- Pacotes Python usados pelas skills de GIF e áudio ---------------------
python3 -m pip install -q --disable-pip-version-check pillow imageio imageio-ffmpeg numpy pydub

# --- Projeto inferno-dante (Remotion) ---------------------------------------
if [ -f "$PROJECT_DIR/inferno-dante/package.json" ]; then
  log "Instalando dependências do inferno-dante..."
  (cd "$PROJECT_DIR/inferno-dante" && npm install --no-audit --no-fund --loglevel=error)
fi

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export BLENDER=/usr/local/bin/blender"
    echo "export VOICESTUDIO_DIR=$VOICESTUDIO_DIR"
    echo "export OMNIVOICE_DEVICE=cpu"
    echo "export OMNIVOICE_ANALYTICS_DISABLED=1"
  } >> "$CLAUDE_ENV_FILE"
fi

log "Pronto."
