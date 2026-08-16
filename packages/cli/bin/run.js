#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const {run} = require('../lib');

if (process.argv.length === 2) {
  require('../lib/banner').printBanner();
}

run().catch(require('@oclif/core/handle'));
