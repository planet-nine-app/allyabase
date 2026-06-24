#!/bin/bash
# Install Node.js via nvm.
# Safe to run multiple times — skips if already installed.

set -e

NODE_VERSION="25.2.1"

# Node v25+ requires libatomic1 (not installed by default on Ubuntu 22.04)
apt-get install -y libatomic1 2>/dev/null || true

export NVM_DIR="$HOME/.nvm"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi

[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

if nvm ls "$NODE_VERSION" &>/dev/null; then
    echo "Node $NODE_VERSION already installed, skipping."
else
    echo "Installing Node $NODE_VERSION..."
    nvm install "$NODE_VERSION"
fi

nvm use "$NODE_VERSION"
nvm alias default "$NODE_VERSION"

# Make node/npm available system-wide for non-nvm shells (e.g. systemd, sudo)
NODE_BIN_DIR="$NVM_DIR/versions/node/$(nvm version $NODE_VERSION)/bin"
if [ ! -L /usr/local/bin/node ]; then
    sudo ln -sf "$NODE_BIN_DIR/node" /usr/local/bin/node
fi
if [ ! -L /usr/local/bin/npm ]; then
    sudo ln -sf "$NODE_BIN_DIR/npm" /usr/local/bin/npm
fi
if [ ! -L /usr/local/bin/npx ]; then
    sudo ln -sf "$NODE_BIN_DIR/npx" /usr/local/bin/npx
fi

echo "Node $(node --version) ready."
