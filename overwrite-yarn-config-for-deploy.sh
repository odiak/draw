#!/bin/bash

set -Eeuo pipefail

yarn config set npmScopes.fortawesome.npmRegistryServer 'https://npm.fontawesome.com'
yarn config set npmScopes.fortawesome.npmAuthToken "$FONTAWESOME_NPM_AUTH_TOKEN"
