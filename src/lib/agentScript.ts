/**
 * Bootstrap script shown in the add-app wizard. The operator copies it and runs
 * it on the target server with sudo. It creates a locked monitoring user, grants
 * Docker access, generates an SSH key LushOps connects with, and prints a
 * connection block (including the private key) to paste back into the UI.
 *
 * Kept brace-free (`$VAR` not `${VAR}`) so it can live in a JS template literal
 * without escaping.
 */
export function provisionScript(user = 'lushops'): string {
  return `#!/usr/bin/env bash
# LushOps server setup — run on the target server as root:
#   sudo bash lushops-setup.sh
set -euo pipefail

LUSHOPS_USER=${user}
HOME_DIR=/home/$LUSHOPS_USER
KEY_PATH=$HOME_DIR/.ssh/id_ed25519

if [ "$(id -u)" -ne 0 ]; then echo "Run with sudo/root." >&2; exit 1; fi

# 1) Dedicated, password-locked user for monitoring
id "$LUSHOPS_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$LUSHOPS_USER"
passwd -l "$LUSHOPS_USER" >/dev/null 2>&1 || true

# 2) Docker access (read stats + run lifecycle actions)
groupadd -f docker
usermod -aG docker "$LUSHOPS_USER"

# 3) Passwordless docker via sudo as a fallback
printf '%s ALL=(ALL) NOPASSWD: /usr/bin/docker\\n' "$LUSHOPS_USER" > /etc/sudoers.d/lushops
chmod 0440 /etc/sudoers.d/lushops

# 4) SSH key LushOps will use to connect
install -d -m 700 -o "$LUSHOPS_USER" -g "$LUSHOPS_USER" "$HOME_DIR/.ssh"
[ -f "$KEY_PATH" ] || ssh-keygen -t ed25519 -N '' -C "lushops@$(hostname)" -f "$KEY_PATH"
grep -qxF "$(cat "$KEY_PATH.pub")" "$HOME_DIR/.ssh/authorized_keys" 2>/dev/null || cat "$KEY_PATH.pub" >> "$HOME_DIR/.ssh/authorized_keys"
chown -R "$LUSHOPS_USER:$LUSHOPS_USER" "$HOME_DIR/.ssh"
chmod 600 "$HOME_DIR/.ssh/authorized_keys"

# 5) Connection block — paste these into the LushOps UI
IP=$(curl -fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
OS=$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")
echo
echo "================ LUSHOPS CONNECTION ================"
echo "VM Instance : $(hostname)"
echo "Host / IP   : $IP"
echo "SSH User    : $LUSHOPS_USER"
echo "OS          : $OS"
echo "----- PRIVATE KEY (save on the LushOps server) -----"
cat "$KEY_PATH"
echo "===================================================="
`;
}
