import fetch from 'node-fetch';
// _QUOTE_SUMMARY_URL_ = f"{_BASE_URL_}/v10/finance/quoteSummary"

import { QUOTE_SUMMARY_MODULES, BASE_URL } from '../const';
import { YFException } from '../exceptions';
import { logger } from '../index';

export class Analysis {
  private symbol: string;
  private log = logger.childLogger(Analysis.name);

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  async _fetch(modules: string[]) {
    modules.join(',');
    if (modules.length === 0) {
      throw new YFException(
        'No valid modules provided, see available modules in QUOTE_SUMMARY_MODULES!'
      );
    }

    try {
      const response = await fetch(`${BASE_URL}/v10/finance/quoteSummary/${this.symbol}`);
      if (response.status !== 200) {
        this.log.debug(JSON.stringify(await response.json()));
        throw new YFException(
          `Failed to fetch data for ${this.symbol}, status code: ${response.status}`
        );
      }
      const json = await response.json();
      console.log(json);
    } catch (err) {
      this.log.error((err as Error).message);
    }
  }
}
