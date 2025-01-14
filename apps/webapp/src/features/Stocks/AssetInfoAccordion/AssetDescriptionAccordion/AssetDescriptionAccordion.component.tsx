import {ExpandMoreRounded} from '@mui/icons-material';
import {Accordion, AccordionDetails, AccordionSummary, Typography} from '@mui/material';
import React from 'react';

export type TAssetDescriptionAccordionProps = {
  description?: string;
};

export const AssetDescriptionAccordion: React.FC<TAssetDescriptionAccordionProps> = ({
  description = 'No description available',
}) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography variant="subtitle1" fontWeight={'bold'}>
          Description
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2">{description}</Typography>
      </AccordionDetails>
    </Accordion>
  );
};
