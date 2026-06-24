'use client';

import type {Entity, EntityOperation, PermissionConfig} from '@budgetbuddyde/api/auth';
import {Box, Checkbox, Divider, FormControlLabel, Paper, Stack, Typography} from '@mui/material';
import React from 'react';

const ENTITY_LABELS: Record<Entity, string> = {
  transaction: 'Transactions',
  recurringPayment: 'Recurring payments',
  budget: 'Budgets',
  category: 'Categories',
  paymentMethod: 'Payment methods',
};

const ENTITIES = Object.keys(ENTITY_LABELS) as Entity[];
const ENTITY_OPERATIONS: EntityOperation[] = ['read', 'write'];

const OPERATION_LABELS: Record<EntityOperation, string> = {
  read: 'Read',
  write: 'Write',
};

export type ApiKeyPermissionFieldProps = {
  value?: PermissionConfig;
  onChange: (permissions: PermissionConfig) => void;
  disabled?: boolean;
};

export const ApiKeyPermissionField: React.FC<ApiKeyPermissionFieldProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const handleChange = (entity: Entity, operation: EntityOperation, checked: boolean) => {
    const currentOperations = value[entity] ?? [];
    const nextOperations = checked
      ? ENTITY_OPERATIONS.filter(candidate => candidate === operation || currentOperations.includes(candidate))
      : currentOperations.filter(candidate => candidate !== operation);
    const nextPermissions = {...value};

    if (nextOperations.length === 0) {
      delete nextPermissions[entity];
    } else {
      nextPermissions[entity] = nextOperations;
    }

    onChange(nextPermissions);
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold">
        Permissions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{mb: 1.5}}>
        Choose which data this API key can read or change.
      </Typography>

      <Paper variant="outlined" sx={{overflow: 'hidden'}}>
        {ENTITIES.map((entity, index) => (
          <React.Fragment key={entity}>
            {index > 0 && <Divider />}
            <Stack
              direction={{xs: 'column', sm: 'row'}}
              alignItems={{xs: 'stretch', sm: 'center'}}
              justifyContent="space-between"
              gap={1}
              sx={{px: 2, py: 1.25}}
            >
              <Typography>{ENTITY_LABELS[entity]}</Typography>
              <Stack direction="row" sx={{alignSelf: {xs: 'flex-start', sm: 'auto'}}}>
                {ENTITY_OPERATIONS.map(operation => (
                  <FormControlLabel
                    key={operation}
                    control={
                      <Checkbox
                        checked={value[entity]?.includes(operation) ?? false}
                        disabled={disabled}
                        onChange={event => handleChange(entity, operation, event.target.checked)}
                        inputProps={{'aria-label': `${ENTITY_LABELS[entity]} ${OPERATION_LABELS[operation]}`}}
                      />
                    }
                    label={OPERATION_LABELS[operation]}
                    sx={{mr: operation === ENTITY_OPERATIONS.at(-1) ? 0 : 1}}
                  />
                ))}
              </Stack>
            </Stack>
          </React.Fragment>
        ))}
      </Paper>
    </Box>
  );
};
