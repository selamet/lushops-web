/**
 * Bootstrap script shown in the add-app wizard. The operator copies it and runs
 * it on the target server with sudo. It creates a locked monitoring user, grants
 * Docker access, generates an SSH key Sentinel connects with, and prints a
 * connection block (including the private key) to paste back into the UI.
 *
 * Kept brace-free (`$VAR` not `${VAR}`) so it can live in a JS template literal
 * without escaping.
 */
export function provisionScript(user = 'sentinel'): string {
  return `#!/usr/bin/env bash
# Sentinel server setup — run on the target server as root:
#   sudo bash sentinel-setup.sh
set -euo pipefail

SENTINEL_USER=${user}
HOME_DIR=/home/$SENTINEL_USER
KEY_PATH=$HOME_DIR/.ssh/id_ed25519

if [ "$(id -u)" -ne 0 ]; then echo "Run with sudo/root." >&2; exit 1; fi

# 1) Dedicated, password-locked user for monitoring
id "$SENTINEL_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$SENTINEL_USER"
passwd -l "$SENTINEL_USER" >/dev/null 2>&1 || true

# 2) Docker access (read stats + run lifecycle actions)
groupadd -f docker
usermod -aG docker "$SENTINEL_USER"

# 3) Passwordless docker via sudo as a fallback
printf '%s ALL=(ALL) NOPASSWD: /usr/bin/docker\\n' "$SENTINEL_USER" > /etc/sudoers.d/sentinel
chmod 0440 /etc/sudoers.d/sentinel

# 4) SSH key Sentinel will use to connect
install -d -m 700 -o "$SENTINEL_USER" -g "$SENTINEL_USER" "$HOME_DIR/.ssh"
[ -f "$KEY_PATH" ] || ssh-keygen -t ed25519 -N '' -C "sentinel@$(hostname)" -f "$KEY_PATH"
grep -qxF "$(cat "$KEY_PATH.pub")" "$HOME_DIR/.ssh/authorized_keys" 2>/dev/null || cat "$KEY_PATH.pub" >> "$HOME_DIR/.ssh/authorized_keys"
chown -R "$SENTINEL_USER:$SENTINEL_USER" "$HOME_DIR/.ssh"
chmod 600 "$HOME_DIR/.ssh/authorized_keys"

# 5) Connection block — paste these into the Sentinel UI
IP=$(curl -fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
OS=$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")
echo
echo "================ SENTINEL CONNECTION ================"
echo "VM Instance : $(hostname)"
echo "Host / IP   : $IP"
echo "SSH User    : $SENTINEL_USER"
echo "OS          : $OS"
echo "----- PRIVATE KEY (save on the Sentinel server) -----"
cat "$KEY_PATH"
echo "===================================================="
`;
}
