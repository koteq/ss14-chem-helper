#!/usr/bin/env bash
set -euo pipefail

clone_fork() {
  local repository=$1
  local directory=$2

  if [ -z "$repository" ] || [ -z "$directory" ]; then
    echo "Usage: clone_fork <repository> <directory>"
    return 1
  fi

  git clone --depth=1 --filter=tree:0 --no-checkout "$repository" "$directory"
  git -C "$directory" sparse-checkout set Resources/Prototypes Resources/Locale
  git -C "$directory" checkout
}

clone_fork "https://github.com/space-wizards/space-station-14.git" "wizden"
clone_fork "https://github.com/space-syndicate/space-station-14.git" "corvax"
clone_fork "https://github.com/space-sunrise/space-station-14.git" "sunrise"
clone_fork "https://github.com/dead-space-server/space-station-14-fobos.git" "dead-space"
