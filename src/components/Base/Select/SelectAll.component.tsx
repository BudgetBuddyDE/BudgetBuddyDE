import React from 'react';
import {Checkbox as MuiCheckbox, type CheckboxProps, TableCell, type TableCellProps} from '@mui/material';
import {AppConfig} from '@/app.config';

export type TSelectAllProps = CheckboxProps &
  (
    | {wrapWithTableCell: true; tableCellProps?: TableCellProps}
    | {wrapWithTableCell?: false; tableCellProps?: undefined}
  );

export const SelectAll: React.FC<TSelectAllProps> = ({wrapWithTableCell, tableCellProps, ...checkboxProps}) => {
  const Checkbox = () => <MuiCheckbox {...checkboxProps} />;
  return wrapWithTableCell ? (
    <TableCell
      size={AppConfig.table.cellSize}
      {...tableCellProps}
      sx={{width: '1%', whiteSpace: 'nowrap', ...tableCellProps?.sx}}>
      <Checkbox />
    </TableCell>
  ) : (
    <Checkbox />
  );
};
