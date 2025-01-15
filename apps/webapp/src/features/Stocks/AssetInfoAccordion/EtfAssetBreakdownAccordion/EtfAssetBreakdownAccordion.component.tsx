import {type TAssetDetails} from '@budgetbuddyde/types';
import {ExpandMoreRounded} from '@mui/icons-material';
import {Accordion, AccordionDetails, AccordionSummary, Typography} from '@mui/material';
import React from 'react';

import {PieChart} from '@/components/Base/Charts';
import {NoResults} from '@/components/NoResults';
import {useScreenSize} from '@/hooks/useScreenSize';

export type TEtfAssetBreakdownAccordionProps = {
  etfBreakdown: TAssetDetails['details']['etfBreakdown'];
};

export const EtfAssetBreakdownAccordion: React.FC<TEtfAssetBreakdownAccordionProps> = ({etfBreakdown}) => {
  const screenSize = useScreenSize();

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography variant="subtitle1" fontWeight={'bold'}>
          ETF Breakdown
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {etfBreakdown!.holdings.length > 0 ? (
          <PieChart
            fullWidth
            series={[
              {
                data: etfBreakdown!.holdings.map(({share, name}) => ({
                  label: name,
                  value: share,
                })),
                valueFormatter: value => value.value.toString(),
                innerRadius: screenSize === 'medium' ? 80 : 110,
                paddingAngle: 1,
                cornerRadius: 5,
                highlightScope: {faded: 'global', highlighted: 'item'},
              },
            ]}
          />
        ) : (
          <NoResults text={`No information about this ETF assets found!`} />
        )}
      </AccordionDetails>
    </Accordion>
  );
};
