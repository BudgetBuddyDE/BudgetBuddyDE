'use client';

import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import type React from 'react';
import {ActionPaper, type ActionPaperProps} from '@/components/ActionPaper';
import {Menu, type MenuProps} from '@/components/Menu';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type EntityMenuProps<T> = {
  entity: T;
  handleEditEntity: (item: T) => void;
  handleDeleteEntity: (item: T) => void;
  actions?: MenuProps['actions'];
} & Omit<ActionPaperProps, 'children'>;

export const EntityMenu = <T,>({
  entity,
  handleEditEntity,
  handleDeleteEntity,
  actions = [],
  children,
  ...actionPaperProps
}: React.PropsWithChildren<EntityMenuProps<T>>) => {
  const t = useAppTranslations();
  return (
    <ActionPaper
      {...actionPaperProps}
      sx={{
        width: 'fit-content',
        ml: 'auto',
        display: 'flex',
        flexWrap: 'nowrap',
        ...actionPaperProps.sx,
      }}
    >
      <Menu
        useIconButton
        iconButtonProps={{
          children: <MoreVertRounded />,
        }}
        actions={[
          {
            children: t('table.edit'),
            onClick: () => handleEditEntity(entity),
          },
          {
            children: t('table.delete'),
            onClick: () => handleDeleteEntity(entity),
          },
          ...actions,
        ]}
      />
      {children}
    </ActionPaper>
  );
};
