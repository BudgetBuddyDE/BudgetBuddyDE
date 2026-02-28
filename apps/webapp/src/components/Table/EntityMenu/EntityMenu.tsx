import {MoreVertRounded} from '@mui/icons-material';
import type React from 'react';
import {ActionPaper, type ActionPaperProps} from '@/components/ActionPaper';
import {Menu, type MenuProps} from '@/components/Menu';

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
      {children}
    </ActionPaper>
  );
};
