import {
  Table as MuiTable,
  TableContainer as MuiTableContainer,
  type TableProps as MuiTableProps,
  type TableContainerProps,
} from '@mui/material';
import React from 'react';

export type TTableContainerProps = React.PropsWithChildren<{
  tableContainerProps?: TableContainerProps;
  tableProps?: MuiTableProps;
}>;

export const TableContainer: React.FC<TTableContainerProps> = ({tableProps, tableContainerProps, children}) => {
  return (
    <MuiTableContainer {...tableContainerProps}>
      <MuiTable aria-label="Table" {...tableProps} sx={{width: '100%', ...tableProps?.sx}}>
        {children}
      </MuiTable>
    </MuiTableContainer>
  );
};
