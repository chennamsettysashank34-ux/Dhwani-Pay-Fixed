#!/bin/sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/android"
exec ./gradlew "$@"
