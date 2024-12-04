import {
  TablePagination as MuiTablePagination,
  type TablePaginationProps as MuiTablePaginationProps,
} from '@mui/material';
import React from 'react';
import {useSearchParams} from 'react-router-dom';

import {ActionPaper} from '../ActionPaper/ActionPaper.component';
import {type TPaginationState} from './Pagination.reducer';

/**
 * Props for the Pagination component.
 */
export type TPaginationProps = Pick<MuiTablePaginationProps, 'count' | 'page' | 'rowsPerPage' | 'labelRowsPerPage'> & {
  /**
   * Callback function triggered when the page is changed.
   * @param newPage - The new page number.
   */
  onPageChange: (newPage: number) => void;
  /**
   * Callback function triggered when the number of rows per page is changed.
   * @param rowsPerPage - The new number of rows per page.
   */
  onRowsPerPageChange: (rowsPerPage: number) => void;
};

/**
 * Represents a handler for pagination events.
 */
export interface IPaginationHandler {
  onPageChange: TPaginationProps['onPageChange'];
  onRowsPerPageChange: TPaginationProps['onRowsPerPageChange'];
}

/**
 * Array containing the available options for the number of rows per page in the pagination component.
 */
export const RowsPerPageOptions = [10, 15, 25, 50];

/**
 * Represents the initial state for pagination.
 */
export const InitialPaginationState: TPaginationState = {
  page: 0,
  rowsPerPage: RowsPerPageOptions[0],
};

/**
 * Pagination component for displaying and controlling pagination of data.
 *
 * @component
 * @example
 * <Pagination
 *   count={100}
 *   page={1}
 *   onPageChange={handlePageChange}
 *   rowsPerPage={10}
 *   labelRowsPerPage="Rows:"
 *   onRowsPerPageChange={handleRowsPerPageChange}
 * />
 *
 * @param {TPaginationProps} props - The pagination component props.
 * @param {number} props.count - The total number of items.
 * @param {number} props.page - The current page number.
 * @param {Function} props.onPageChange - The callback function to handle page change.
 * @param {number} [props.rowsPerPage=10] - The number of items to display per page.
 * @param {string} [props.labelRowsPerPage='Rows:'] - The label for the rows per page select.
 * @param {Function} props.onRowsPerPageChange - The callback function to handle rows per page change.
 * @returns {JSX.Element} The pagination component.
 */
export const Pagination: React.FC<TPaginationProps> = ({
  count,
  page,
  onPageChange,
  rowsPerPage = RowsPerPageOptions[0],
  labelRowsPerPage = 'Rows:',
  onRowsPerPageChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryPage = parseInt(searchParams.get('page') ?? InitialPaginationState.page.toString(), 10);
  const queryRowsPerPage = parseInt(searchParams.get('rpp') ?? InitialPaginationState.rowsPerPage.toString(), 10);

  const validRowsPerPage = RowsPerPageOptions.includes(queryRowsPerPage) ? queryRowsPerPage : RowsPerPageOptions[0];

  const maxPage = Math.ceil(count / validRowsPerPage) - 1;
  const validPage = queryPage < 0 ? 0 : queryPage > maxPage ? maxPage : queryPage;

  React.useEffect(() => {
    if (page !== validPage) {
      onPageChange(validPage);
    }
    if (rowsPerPage !== validRowsPerPage) {
      onRowsPerPageChange(validRowsPerPage);
    }
  }, [validPage, validRowsPerPage, onPageChange, onRowsPerPageChange, page, rowsPerPage, count]);

  const handlePageChange: MuiTablePaginationProps['onPageChange'] = (_event, newPage) => {
    setSearchParams({page: newPage.toString(), rpp: rowsPerPage.toString()});
    onPageChange(newPage);
  };

  const handleRowsPerPageChange: MuiTablePaginationProps['onRowsPerPageChange'] = event => {
    const newRowsPerPage = Number(event.target.value);
    setSearchParams({page: page.toString(), rpp: newRowsPerPage.toString()});
    onRowsPerPageChange(newRowsPerPage);
  };

  return (
    <ActionPaper sx={{width: 'fit-content', ml: 'auto', pr: 0.5}}>
      <MuiTablePagination
        component="div"
        count={count}
        page={validPage}
        onPageChange={handlePageChange}
        labelRowsPerPage={labelRowsPerPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </ActionPaper>
  );
};
