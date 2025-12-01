#!/usr/bin/env bash

set -euo pipefail

# Inject MAPBOX_DOWNLOADS_TOKEN into gradle.properties if the environment variable is set
if [ -n "${MAPBOX_DOWNLOADS_TOKEN:-}" ]; then
  echo "Injecting MAPBOX_DOWNLOADS_TOKEN into android/gradle.properties"
  echo "" >> android/gradle.properties
  echo "MAPBOX_DOWNLOADS_TOKEN=${MAPBOX_DOWNLOADS_TOKEN}" >> android/gradle.properties
else
  echo "Warning: MAPBOX_DOWNLOADS_TOKEN environment variable not set"
fi
