import {
  type CheckboxProps,
  Checkbox as MuiCheckbox,
  TableCell,
  type TableCellProps,
} from '@mui/material';
import React from 'react';

export type TSelectAllProps = CheckboxProps &
  (
    | { wrapWithTableCell: true; tableCellProps?: TableCellProps }
    | { wrapWithTableCell?: false; tableCellProps?: undefined }
  );

export const SelectAll: React.FC<TSelectAllProps> = ({
  wrapWithTableCell,
  tableCellProps,
  ...checkboxProps
}) => {
  const Checkbox = () => <MuiCheckbox {...checkboxProps} />;
  return wrapWithTableCell ? (
    <TableCell
      size={'medium'}
      {...tableCellProps}
      sx={{ width: '1%', whiteSpace: 'nowrap', ...tableCellProps?.sx }}
    >
      <Checkbox />
    </TableCell>
  ) : (
    <Checkbox />
  );
};
