#!/bin/bash
set -eo pipefail
[[ "$TRACE" ]] && set -x

usage() {
  echo "Usage: sh scripts/dev.sh"
}

log() {
  local index="$2"
  local color="$((31 + (index % 7)))"
  local format="\033[0;${color}m%s %s\t|\033[0m %s"

  while IFS= read -r data
  do
    printf "$format\n" "$(date +"%H:%M:%S")" "$1" "$data"
    echo "$1 | $data" | sed -r 's/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]//g' >> dev.log
  done
}

store_pid() {
  pids="$pids $1"
  echo "$pids" > .dev.pid
}

start_command() {
  bash -c "$1" 2>&1 | log "$2" "$3" &
  pid="$(jobs -p %%)"
  store_pid "$pid"
}

onexit() {
  echo "SIGINT received"
  echo "sending SIGTERM to all processes"
  kill $pids > /dev/null 2>&1 || true
  rm .dev.pid > /dev/null 2>&1 || true
  sleep 1
}

main() {
  local procfile="$1"
  local env_file="$2"

  if [ -f .dev.pid ]; then
    echo "Dev server already running. It auto-reloads on file changes, no need to restart it."
    exit 1
  fi

  echo "" > dev.log
  start_command "bun dev:backend" "backend" "1"
  sleep 7
  start_command "bun dev:frontend" "frontend" "2"

  trap onexit INT TERM

  exitcode=0
  for pid in $pids; do
      wait "${pid}" || exitcode=$?
      kill "${pid}" > /dev/null 2>&1 || true
  done
  exit $exitcode
}

main "$@"