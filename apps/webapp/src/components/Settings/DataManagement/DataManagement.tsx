'use client';

import {ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {DataExport} from '../DataExport';
import {DataImport} from '../DataImport';

type TDataAction = 'export' | 'import';

export const DataManagement = () => {
  const t = useAppTranslations();
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
            aria-label={t('settings.dataManagement.dataManagementAction')}
            sx={{alignSelf: {xs: 'stretch', sm: 'flex-start'}, '& .MuiToggleButton-root': {flex: {xs: 1, sm: 'none'}}}}
          >
            <ToggleButton value="export">{t('settings.dataManagement.export')}</ToggleButton>
            <ToggleButton value="import">{t('settings.dataManagement.import')}</ToggleButton>
          </ToggleButtonGroup>
        </ActionPaper>
      </Card.Header>
      {action === 'export' ? (
        <>
          <Card.Body>
            <Typography variant="body2">
              {t('settings.dataManagement.downloadACopyOfYourAccountAndApplicationData')}
            </Typography>
          </Card.Body>
          <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <DataExport asButton />
          </Card.Footer>
        </>
      ) : (
        <>
          <Card.Body>
            <Typography variant="body2">
              {t('settings.dataManagement.restoreApplicationDataFromABudgetBuddyExportArchive')}
            </Typography>
          </Card.Body>
          <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <DataImport asButton />
          </Card.Footer>
        </>
      )}
    </Card>
  );
};
