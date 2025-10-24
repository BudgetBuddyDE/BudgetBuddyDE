import { Card } from '@/components/Card';
import { ReadMoreText } from '@/components/ReadMoreText';
import { type TAsset } from '@/types';
import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import React from 'react';

export type EtfCompanyDetailsProps = Pick<
  TAsset,
  | 'name'
  | 'securityType'
  | 'identifier'
  | 'wkn'
  | 'assetType'
  | 'description'
  | 'etfCompany'
  | 'etfDomicile'
>;

export const EtfCompanyDetails: React.FC<EtfCompanyDetailsProps> = ({
  name,
  securityType,
  assetType,
  identifier,
  wkn,
  etfCompany,
  etfDomicile,
  description,
}) => {
  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ px: 2, pt: 2, mb: 0 }}>
        <Box>
          <Card.Title>Company Details</Card.Title>
          <Card.Subtitle>Information about the company</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <List dense disablePadding sx={{ py: 0 }}>
          <ListItem secondaryAction={<Typography>{name}</Typography>}>
            <ListItemText primary={<Typography>Name</Typography>} />
          </ListItem>
          <Divider />
          <ListItem secondaryAction={<Typography>{etfCompany}</Typography>}>
            <ListItemText primary={<Typography>Emittent</Typography>} />
          </ListItem>
          <Divider />
          <ListItem secondaryAction={<Typography>{etfDomicile}</Typography>}>
            <ListItemText primary={<Typography>Domicile</Typography>} />
          </ListItem>
          <Divider />
          <ListItem secondaryAction={<Typography>{assetType}</Typography>}>
            <ListItemText primary={<Typography>Asset Type</Typography>} />
          </ListItem>
          <Divider />
          <ListItem secondaryAction={<Typography>{securityType}</Typography>}>
            <ListItemText primary={<Typography>Security Type</Typography>} />
          </ListItem>
          <Divider />
          <ListItem secondaryAction={<Typography>{identifier}</Typography>}>
            <ListItemText primary={<Typography>Identifier</Typography>} />
          </ListItem>
          <Divider />
          <ListItem secondaryAction={<Typography>{wkn ?? 'None'}</Typography>}>
            <ListItemText primary={<Typography>WKN</Typography>} />
          </ListItem>
          {description && description.length > 0 && (
            <React.Fragment>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ px: 2, pb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Description
                </Typography>
                <ReadMoreText text={description} />
              </Box>
            </React.Fragment>
          )}
        </List>
      </Card.Body>
    </Card>
  );
};
