import {CountryMapping, IndustryMapping, RegionMapping, SectorMapping, type TAssetDetails} from '@budgetbuddyde/types';
import {ExpandMoreRounded} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import React from 'react';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {PieChart} from '@/components/Base/Charts';
import {NoResults} from '@/components/NoResults';
import {useScreenSize} from '@/hooks/useScreenSize';

type TOptionValue = 'regions' | 'sectors' | 'countries' | 'industries';

const BTN_OPTIONS = [
  {value: 'regions', label: 'Regions'},
  {value: 'countries', label: 'Countries'},
  {value: 'sectors', label: 'Sectors'},
  {value: 'industries', label: 'Industries'},
] as const;

export type TAssetBreakdownAccordionProps = {
  details: TAssetDetails;
};

export const AssetBreakdownAccordion: React.FC<TAssetBreakdownAccordionProps> = ({details}) => {
  const screenSize = useScreenSize();
  const [category, setCategory] = React.useState<TOptionValue>('regions');

  const chartData = React.useMemo(() => {
    let mapping: Map<string, string>;
    switch (category) {
      case 'regions':
        mapping = RegionMapping;
        break;
      case 'sectors':
        mapping = SectorMapping;
        break;
      case 'countries':
        mapping = CountryMapping;
        break;
      case 'industries':
        mapping = IndustryMapping;
        break;
    }

    return details.asset.security[category].map(({id, share}) => ({
      label: (mapping.get(id) ?? mapping.get('OTHER')) as string,
      value: share,
    }));
  }, [category]);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography variant="subtitle1" fontWeight={'bold'}>
          Breakdown
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px: 0}}>
        <ActionPaper
          sx={{
            borderRadius: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={category}
            onChange={(_, value) => setCategory(value)}
            exclusive>
            {BTN_OPTIONS.map(button => (
              <ToggleButton key={button.value} value={button.value}>
                {button.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </ActionPaper>
        <Box sx={{px: 2, pt: 2}}>
          {chartData.length > 0 ? (
            <PieChart
              fullWidth
              series={[
                {
                  data: chartData,
                  valueFormatter: value => `${value.value} shares`,
                  innerRadius: screenSize === 'medium' ? 80 : 110,
                  paddingAngle: 1,
                  cornerRadius: 5,
                  highlightScope: {faded: 'global', highlighted: 'item'},
                },
              ]}
            />
          ) : (
            <NoResults text={`No information about ${category} provided!`} />
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
