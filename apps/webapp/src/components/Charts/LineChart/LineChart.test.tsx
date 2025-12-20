import {createTheme, ThemeProvider} from '@mui/material';
import {render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {LineChart, type LineChartProps} from './LineChart';

describe('LineChart', () => {
  const theme = createTheme();

  const renderWithTheme = (props: LineChartProps) =>
    render(
      <ThemeProvider theme={theme}>
        <LineChart {...props} />
      </ThemeProvider>,
    );

  it('renders without crashing', () => {
    const props: LineChartProps = {
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
