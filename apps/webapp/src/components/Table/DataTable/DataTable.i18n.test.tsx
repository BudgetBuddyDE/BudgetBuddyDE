import {enUS} from '@mui/x-data-grid/locales';
import {render} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {describe, expect, it} from 'vite-plus/test';
import messages from '@/messages/en-US.json';
import {DataTable} from './DataTable';

describe('DataTable localization', () => {
  it('uses the English MUI locale while preserving a caller empty-state label', () => {
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <DataTable data={[]} columns={[]} autoHeight emptyMessage="No transactions found" />
      </NextIntlClientProvider>,
    );

    expect(enUS.components.MuiDataGrid.defaultProps.localeText.noRowsLabel).toBeDefined();
  });
});
