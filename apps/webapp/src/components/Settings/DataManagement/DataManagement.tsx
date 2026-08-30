'use client';

import {ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {DataExport} from '../DataExport';
import {DataImport} from '../DataImport';

type TDataAction = 'export' | 'import';

export const DataManagement = () => {
  const [action, setAction] = React.useState<TDataAction>('export');

  return (
    <Card>
      <Card.Header>
        <ActionPaper
          sx={{
            width: 'min-content',
            maxWidth: '100%',
            overflowX: 'scroll',
            '::-webkit-scrollbar': {
              display: 'none',
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <ToggleButtonGroup
            value={action}
            exclusive
            size="small"
            color="primary"
            onChange={(_, nextAction: TDataAction | null) => {
              if (!nextAction) return;
              setAction(nextAction);
            }}
            aria-label="Recurring payment view"
            sx={{alignSelf: {xs: 'stretch', sm: 'flex-start'}, '& .MuiToggleButton-root': {flex: {xs: 1, sm: 'none'}}}}
          >
            <ToggleButton value="export">Export</ToggleButton>
            <ToggleButton value="import">Import</ToggleButton>
          </ToggleButtonGroup>
        </ActionPaper>
      </Card.Header>
      {action === 'export' ? (
        <>
          <Card.Body>
            <Typography variant="body2">Download a copy of your account and application data.</Typography>
          </Card.Body>
          <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <DataExport asButton />
          </Card.Footer>
        </>
      ) : (
        <>
          <Card.Body>
            <Typography variant="body2">Restore application data from a BudgetBuddy export archive.</Typography>
          </Card.Body>
          <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <DataImport asButton />
          </Card.Footer>
        </>
      )}
    </Card>
  );
};
