import {ThemeProvider, createTheme} from '@mui/material';
import {render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {LineChart, TLineChartProps} from './LineChart.component';

describe('LineChart', () => {
  const theme = createTheme();

  const renderWithTheme = (props: TLineChartProps) =>
    render(
      <ThemeProvider theme={theme}>
        <LineChart {...props} />
      </ThemeProvider>,
    );

  it('renders without crashing', () => {
    const props: TLineChartProps = {
      series: [
        {
          data: [10, 20],
        },
      ],
    };
    const {container} = renderWithTheme(props);
    expect(container).toBeInTheDocument();
  });
});
