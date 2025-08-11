import { ActionPaper } from '@/components/ActionPaper';
import { Menu, type MenuProps } from '@/components/Menu';
import { MoreVertRounded } from '@mui/icons-material';
import React from 'react';

export type EntityMenuProps<T> = {
  entity: T;
  handleEditEntity: (item: T) => void;
  handleDeleteEntity: (item: T) => void;
  actions?: MenuProps['actions'];
};

export const EntityMenu = <T,>({
  entity,
  handleEditEntity,
  handleDeleteEntity,
  actions = [],
}: EntityMenuProps<T>) => {
  return (
    <ActionPaper sx={{ width: 'fit-content', ml: 'auto' }}>
      <Menu
        useIconButton
        iconButtonProps={{
          children: <MoreVertRounded />,
        }}
        actions={[
          {
            children: 'Edit',
            onClick: () => handleEditEntity(entity),
          },
          {
            children: 'Delete',
            onClick: () => handleDeleteEntity(entity),
          },
          ...actions,
        ]}
      />
    </ActionPaper>
  );
};
