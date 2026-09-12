#!/bin/sh
set -eu

NEW_VERSION="$(cat version/version)"
META_DIR="$(pwd)/release-meta"

echo "==> Releasing ${UNIT_NAME} (${UNIT_TYPE}) as v${NEW_VERSION}"

cd repository

npm ci
npx turbo run format:check lint:check typecheck test build --filter="${NPM_PACKAGE}"

cd "${UNIT_PATH}"
npm version "${NEW_VERSION}" --no-git-tag-version

if [ "${UNIT_TYPE}" = "npm" ]; then
  if grep -rE "['\"]@budgetbuddyde/" src >/dev/null 2>&1; then
    echo "ERROR: ${NPM_PACKAGE} imports internal @budgetbuddyde packages."
    echo "Publish the internal dependency first and keep it as a dependency before releasing."
    exit 1
  fi

  node - <<'NODE'
const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
let changed = false;

for (const field of ['dependencies', 'optionalDependencies']) {
  if (!pkg[field]) continue;

  for (const name of Object.keys(pkg[field])) {
    if (name.startsWith('@budgetbuddyde/')) {
      delete pkg[field][name];
      changed = true;
    }
  }
}

if (changed) {
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
}
NODE

  npm pkg delete private

  printf '//registry.npmjs.org/:_authToken=%s\n' "${NPM_TOKEN}" > "${HOME}/.npmrc"
  npm publish --access public
fi

mkdir -p "${META_DIR}"
printf '%s\n' "${UNIT_NAME}-v${NEW_VERSION}" > "${META_DIR}/tag"
printf 'Release %s-v%s\n' "${UNIT_NAME}" "${NEW_VERSION}" > "${META_DIR}/annotate"

echo "==> Released ${UNIT_NAME}-v${NEW_VERSION}"
