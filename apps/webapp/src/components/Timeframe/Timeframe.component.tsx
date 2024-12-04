import {type TTimeframe, ZTimeframe} from '@budgetbuddyde/types';
import {ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {useSearchParams} from 'react-router-dom';

export type TTimeframeProps = {
  onChange: (timeframe: TTimeframe) => void;
};

export const Timeframe: React.FC<TTimeframeProps> = ({onChange}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedQueryTimeframe: TTimeframe = React.useMemo(() => {
    if (!searchParams.has('timeframe') || searchParams.size === 0) return '3m';
    const parsingResult = ZTimeframe.safeParse(searchParams.get('timeframe'));
    return parsingResult.success ? parsingResult.data : '3m';
  }, [location.search]);
  const [timeframe, setTimeframe] = React.useState<TTimeframe>(parsedQueryTimeframe);
  return (
    <ToggleButtonGroup
      size="small"
      color="primary"
      value={timeframe}
      onChange={(event: React.BaseSyntheticEvent) => {
        const value = event.target.value as TTimeframe;
        if (value === timeframe) return;
        setTimeframe(value);
        onChange(value);
        searchParams.set('timeframe', value);
        setSearchParams(searchParams);
      }}
      exclusive>
      {['1W', '1M', '3M', '1Y', '5Y', 'YTD'].map(timeframe => (
        <ToggleButton key={timeframe} value={timeframe.toLowerCase()}>
          {timeframe}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
