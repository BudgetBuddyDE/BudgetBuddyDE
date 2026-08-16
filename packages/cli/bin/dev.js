#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

require('ts-node/register');

const {run} = require('@oclif/core');

if (process.argv.length === 2) {
  require('../src/banner').printBanner();
}

run().catch(require('@oclif/core/handle'));
