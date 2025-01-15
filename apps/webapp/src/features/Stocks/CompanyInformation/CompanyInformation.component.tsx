import {type TAssetDetails} from '@budgetbuddyde/types';
import {
  BookmarkRounded,
  BusinessRounded,
  PeopleRounded,
  PublicRounded,
  SportsMartialArtsRounded,
  TodayRounded,
} from '@mui/icons-material';
import {Divider, List, ListItem, ListItemIcon, ListItemText, Typography} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {Card} from '@/components/Base/Card';

export type TCompanyInformationProps = {
  details: TAssetDetails;
};

export const CompanyInformation: React.FC<TCompanyInformationProps> = ({details}) => {
  const data = React.useMemo(() => {
    return [
      {
        icon: <BusinessRounded fontSize="small" />,
        text: 'Company',
        value: details.asset.security.etfCompany,
      },
      {
        icon: <SportsMartialArtsRounded fontSize="small" />,
        text: 'CEO',
        value: details.details.securityDetails?.ceo,
      },
      {
        icon: <PublicRounded fontSize="small" />,
        text: 'Domicile',
        value: details.asset.security.etfDomicile,
      },
      {
        icon: <BookmarkRounded fontSize="small" />,
        text: 'ISIN',
        value: details.asset.security.isin,
      },
      {
        icon: <BookmarkRounded fontSize="small" />,
        text: 'WKN',
        value: details.asset.security.wkn,
      },
      {
        icon: <PeopleRounded fontSize="small" />,
        text: 'Employees (Full-Time)',
        value: details.details.securityDetails?.fullTimeEmployees.toLocaleString(),
      },
      {
        icon: <TodayRounded fontSize="small" />,
        text: 'IPO',
        value: format(details.asset.security.ipoDate, 'dd.MM.yyyy'),
      },
    ].filter(({value}) => value);
  }, [details]);

  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Card.Title>Copany information</Card.Title>
      </Card.Header>
      <Card.Body sx={{px: 0}}>
        <List dense>
          {data.map(({icon, text, value}, idx, arr) => (
            <React.Fragment key={text.toLowerCase()}>
              <ListItem secondaryAction={<Typography>{value}</Typography>}>
                <ListItemIcon sx={{minWidth: 'unset', mr: 1}}>{icon}</ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
              {idx !== arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Card.Body>
    </Card>
  );
};
