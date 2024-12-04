import {DeleteRounded} from '@mui/icons-material';
import {Box, Button, Fade, Paper, Skeleton, TableBody, TableCell, TableHead, TableRow, Typography} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';
import {useDrawerStore} from '@/components/Layout/Drawer';
import {CircularProgress} from '@/components/Loading';
import {drawerWidth as AppDrawerWidth} from '@/style/theme/theme';

import {NoResults, type TNoResultsProps} from '../../NoResults/NoResults.component';
import {ActionPaper} from '../ActionPaper/ActionPaper.component';
import {Card} from '../Card';
import {
  type IPaginationHandler,
  InitialPaginationState,
  Pagination,
  PaginationReducer,
  usePagination,
} from '../Pagination';
import {type ISelectionHandler, SelectAll} from '../SelectAll';
import {TableContainer} from './TableContainer.component';

export type TTableSelectionProps<T> = {
  onSelectAll: ISelectionHandler<T>['onSelectAll'];
  onDelete?: () => void;
  amountOfSelectedEntities: number;
};

export type TTableProps<T> = {
  title?: string;
  subtitle?: string;
  headerCells: string[];
  renderHeaderCell?: (headerCell: string) => React.ReactNode;
  data: T[];
  renderRow: (row: T) => React.ReactNode;
  tableActions?: React.ReactNode;
  isLoading?: boolean;
  noResultsMessage?: TNoResultsProps['text'];
} & (
  | ({
      withSelection: true;
    } & TTableSelectionProps<T>)
  | {withSelection?: false}
);

interface ITableHandler {
  pagination: IPaginationHandler;
}

export const Table = <T,>({
  title,
  subtitle,
  headerCells,
  renderHeaderCell,
  data,
  renderRow,
  tableActions,
  isLoading = false,
  noResultsMessage = 'No records found',
  ...props
}: TTableProps<T>) => {
  const {open: isAppDrawerOpen} = useDrawerStore();
  const [state, dispatch] = React.useReducer(PaginationReducer, InitialPaginationState);
  const [checked, setChecked] = React.useState(false);
  const currentPageData = usePagination(data, state);

  const handler: ITableHandler = {
    pagination: {
      onPageChange(newPage) {
        dispatch({type: 'CHANGE_PAGE', page: newPage});
      },
      onRowsPerPageChange(rowsPerPage) {
        dispatch({type: 'CHANGE_ROWS_PER_PAGE', rowsPerPage: rowsPerPage});
      },
    },
  };

  React.useLayoutEffect(() => {
    setChecked(false);
    if (!props.withSelection) return;
    if (props.amountOfSelectedEntities === data.length) {
      setChecked(true);
    }
  }, [props, data]);

  return (
    <React.Fragment>
      <Card sx={{p: 0}}>
        {(title || subtitle) && (
          <Card.Header sx={{px: 2, pt: 2}}>
            <Box>
              {title && <Card.Title>{title || 'Table'}</Card.Title>}
              {subtitle && <Card.Subtitle>{subtitle}</Card.Subtitle>}
            </Box>
            {tableActions && (
              <Card.HeaderActions sx={{mt: {xs: 1, md: 0}, width: {md: 'unset'}}}>
                <ActionPaper sx={{display: 'flex', flexDirection: 'row'}}>
                  {isLoading ? (
                    <Skeleton variant="rounded" sx={{width: {xs: '5rem', md: '10rem'}, height: '2.3rem'}} />
                  ) : (
                    tableActions
                  )}
                </ActionPaper>
              </Card.HeaderActions>
            )}
          </Card.Header>
        )}
        <Card.Body sx={{px: 0}}>
          {isLoading ? (
            <CircularProgress />
          ) : currentPageData.length > 0 ? (
            <TableContainer>
              <TableHead>
                <TableRow>
                  {props.withSelection && (
                    <SelectAll
                      checked={checked}
                      indeterminate={props.amountOfSelectedEntities > 0 && props.amountOfSelectedEntities < data.length}
                      onChange={(_event, checked) => {
                        const indeterminate =
                          props.amountOfSelectedEntities > 0 && props.amountOfSelectedEntities < data.length;
                        props.onSelectAll(indeterminate ? false : checked);
                      }}
                      wrapWithTableCell
                    />
                  )}

                  {headerCells.map(headerCell =>
                    renderHeaderCell ? (
                      renderHeaderCell(headerCell)
                    ) : (
                      <TableCell
                        key={headerCell.replaceAll(' ', '_').toLowerCase()}
                        size={AppConfig.table.cellSize}
                        sx={{whiteSpace: 'nowrap'}}>
                        <Typography fontWeight={'bold'}>{headerCell}</Typography>
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>{currentPageData.map(renderRow)}</TableBody>
            </TableContainer>
          ) : (
            <NoResults text={noResultsMessage} sx={{mx: 2, mt: 2}} />
          )}
        </Card.Body>
        <Card.Footer sx={{p: 2}}>
          <Pagination
            {...state}
            count={data.length}
            onPageChange={handler.pagination.onPageChange}
            onRowsPerPageChange={handler.pagination.onRowsPerPageChange}
          />
        </Card.Footer>
      </Card>

      {props.withSelection && (
        <Fade in={props.amountOfSelectedEntities > 0}>
          <Box
            sx={{
              zIndex: 1,
              position: 'fixed',
              left: theme => ({
                xs: '50%',
                /**
                 * In order to be centered inside the ContentGrid (app-content) we need to include the Drawer/Sidebar width in the calculation.
                 * This is because the Drawer/Sidebar is not part of the ContentGrid.
                 */
                md: `calc(50% + ${isAppDrawerOpen ? AppDrawerWidth / 2 + 'px' : theme.spacing(3.5)})`,
              }),
              transform: 'translateX(-50%)',
              bottom: '1rem',
            }}>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 4,
                py: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '30px',
              }}>
              <Typography noWrap>
                {props.amountOfSelectedEntities} {props.amountOfSelectedEntities === 1 ? 'Record' : 'Records'}
              </Typography>
              {props.onDelete && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteRounded />}
                  sx={{ml: 3}}
                  onClick={() => props.onDelete && props.onDelete()}>
                  Delete
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ml: 1}}
                onClick={() => props.onSelectAll(false)}>
                Clear
              </Button>
            </Paper>
          </Box>
        </Fade>
      )}
    </React.Fragment>
  );
};
