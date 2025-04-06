#!/usr/bin/env bash
set -euo pipefail

# This script automates the cloning of specific forks of Space Station 14.
# It uses sparse checkout to only fetch the necessary directories,
# reducing the amount of data downloaded and improving efficiency.

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

sparse_clone() {
  local directory=$1
  local repository=$2
  
  shift 2
  local locales=("$@")
  local sparse_dirs=("Resources/Prototypes")

  # Add locale-specific directories to sparse_dirs
  for locale in "${locales[@]}"; do
    sparse_dirs+=("Resources/Locale/${locale}")
  done

  if [ ! -d "$script_dir/$directory" ]; then
    git clone --depth=1 --filter=tree:0 --no-checkout "$repository" "$script_dir/$directory"
  fi
  git -C "$script_dir/$directory" sparse-checkout set "${sparse_dirs[@]}"
  git -C "$script_dir/$directory" checkout
}

# Technically, it supports multiple locales, but we only use one for now.
sparse_clone "wizden" "https://github.com/space-wizards/space-station-14.git" "en-US"
sparse_clone "corvax" "https://github.com/space-syndicate/space-station-14.git" "ru-RU"
sparse_clone "sunrise" "https://github.com/space-sunrise/space-station-14.git" "ru-RU"
sparse_clone "dead-space" "https://github.com/dead-space-server/space-station-14-fobos.git" "ru-RU"
sparse_clone "imperial-space" "https://github.com/imperial-space/SS14-public.git" "ru-RU"
echo "Done!"
