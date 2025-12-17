'use client';

import {AddRounded, CloudDownload, CloudDownloadRounded, DeleteRounded} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Fade,
  IconButton,
  type IconButtonProps,
  lighten,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  type TableCellProps,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {Card, type HeaderActionsProps} from '@/components/Card';
import {ErrorAlert, type ErrorAlertProps} from '@/components/ErrorAlert';
import {SearchInput, type SearchInputProps} from '@/components/Form/SearchInput';
import {useDrawerContext} from '@/components/Layout/Drawer';
import {CircularProgress} from '@/components/Loading';
import {NoResults, type NoResultsProps} from '@/components/NoResults';
import {useScreenSize} from '@/hooks/useScreenSize';
import {DrawerWidth} from '@/theme/style';
import {downloadAsJson} from '@/utils/downloadAsJson';
import {Formatter} from '@/utils/Formatter';
import {Pagination, type PaginationProps} from './Pagination';

export type EntityTableProps<Entity, EntityKey extends keyof Entity> = {
  title: string;
  subtitle?: string;
  slots?: Partial<{
    title: {showCount?: boolean};
    actions: HeaderActionsProps;
    create: IconButtonProps & {enabled: boolean};
    export: IconButtonProps & {enabled: boolean};
    noResults: NoResultsProps;
    error: Omit<ErrorAlertProps, 'error'>;
    search: SearchInputProps & {enabled: boolean};
  }>;
  isLoading?: boolean;
  data: Entity[];
  withSelection?: boolean;
  isSelected?: (item: Entity, selectedEntites: Entity[EntityKey][]) => boolean;
  onDeleteSelectedEntities?: (selectedEntities: Entity[EntityKey][]) => void;
  totalEntityCount?: number;
  dataKey: EntityKey;
  headerCells: (
    | keyof Entity
    | {key: keyof Entity; label: string; align?: TableCellProps['align']}
    | {placeholder: true}
  )[];
  renderHeaderCell?: (cell: keyof Entity, data: Entity[]) => React.ReactNode;
  renderRow: (cell: keyof Entity, item: Entity, data: Entity[]) => React.ReactNode;
  error?: ErrorAlertProps['error'];
  pagination: PaginationProps;
  rowHeight?: number;
};

export const ITEMS_IN_VIEW = 8; // Number of items to display in the table view

const SelectedEntitiesActionPopup: React.FC<
  React.PropsWithChildren<{
    isShown: boolean;
    amountOfSelectedEntities: number;
    isAppDrawerCurrentlyOpen: boolean;
  }>
> = ({isShown, amountOfSelectedEntities, isAppDrawerCurrentlyOpen, children}) => {
  if (!children) return null;
  return (
    <Fade in={isShown}>
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
            md: `calc(50% + ${isAppDrawerCurrentlyOpen ? `${DrawerWidth / 2}px` : theme.spacing(3.5)})`,
          }),
          transform: 'translateX(-50%)',
          bottom: '1rem',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 4,
            py: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '30px',
          }}
        >
          <Typography noWrap>
            {amountOfSelectedEntities} {amountOfSelectedEntities === 1 ? 'Record' : 'Records'}
          </Typography>

          {children}
        </Paper>
      </Box>
    </Fade>
  );
};

export const EntityTable = <Entity, EntityKey extends keyof Entity>({
  title,
  subtitle,
  isLoading = false,
  data,
  withSelection = false,
  isSelected = (item: Entity, selectedEntites: Entity[EntityKey][]) => {
    return selectedEntites.includes(item[dataKey]);
  },
  onDeleteSelectedEntities,
  totalEntityCount,
  dataKey,
  headerCells,
  renderHeaderCell,
  renderRow,
  slots,
  error,
  pagination,
  rowHeight = 73.5,
}: EntityTableProps<Entity, EntityKey>) => {
  const {isOpen: isAppDrawerOpen} = useDrawerContext();
  const screenSize = useScreenSize();
  const MAX_HEIGHT = 56 + rowHeight * ITEMS_IN_VIEW;
  const NO_RESULTS_TEXT = 'No items found';
  const hasError = !!(error && (typeof error === 'object' || (typeof error === 'string' && error.length > 0)));
  const [selectedEntites, setSelectedEntities] = React.useState<Entity[EntityKey][]>([]);
  const amountOfSelectedEntities = selectedEntites.length;

  const areEntitiesIndeterminate = React.useCallback(() => {
    return amountOfSelectedEntities > 0 && amountOfSelectedEntities < pagination.rowsPerPage;
  }, [amountOfSelectedEntities, pagination.rowsPerPage]);

  const isAppDrawerCurrentlyOpen = React.useMemo(() => {
    return isAppDrawerOpen(screenSize);
  }, [screenSize, isAppDrawerOpen]);

  const clearSelectedEntities = () => {
    setSelectedEntities([]);
  };

  return (
    <>
      <Card sx={{px: 0}}>
        <Card.Header sx={{px: 2}}>
          <Box>
            <Card.Title>
              {title} {slots?.title?.showCount && `(${totalEntityCount || data.length})`}
            </Card.Title>
            {subtitle && subtitle.length > 0 && <Card.Subtitle>{subtitle}</Card.Subtitle>}
          </Box>
          <Card.HeaderActions {...slots?.actions}>
            <ActionPaper sx={{display: 'flex', flexDirection: 'row'}}>
              {isLoading && data.length === 0 ? (
                <Skeleton variant="rounded" sx={{width: {xs: '5rem', md: '10rem'}, height: '2.3rem'}} />
              ) : (
                <React.Fragment>
                  {slots?.search?.enabled && <SearchInput {...slots.search} />}
                  {slots?.create?.enabled && (
                    <Tooltip title="Create entity" placement="bottom">
                      <IconButton color="primary" {...slots.create}>
                        <AddRounded fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {slots?.export?.enabled && (
                    <Tooltip title="Export entities" placement="bottom">
                      <IconButton color="primary" {...slots.export}>
                        <CloudDownloadRounded fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  )}
                </React.Fragment>
              )}
            </ActionPaper>
          </Card.HeaderActions>
        </Card.Header>
        <Card.Body>
          {!isLoading && !hasError && data.length === 0 && (
            <NoResults text={NO_RESULTS_TEXT} {...slots?.noResults} sx={{m: 2, ...slots?.noResults?.sx}} />
          )}

          {hasError && <ErrorAlert error={error} {...slots?.error} sx={{m: 2, ...slots?.error?.sx}} />}

          {isLoading && data.length === 0 && <CircularProgress />}

          {data.length > 0 && (
            <TableContainer sx={{maxHeight: MAX_HEIGHT}}>
              <Table stickyHeader sx={{tableLayout: 'auto'}}>
                <TableHead>
                  <TableRow>
                    {withSelection && (
                      <TableCell
                        sx={{
                          width: '1%',
                          whiteSpace: 'nowrap',
                          backgroundColor: theme => lighten(theme.palette.background.paper, 3.35 * 0.025),
                        }}
                      >
                        <Checkbox
                          checked={amountOfSelectedEntities === pagination.rowsPerPage}
                          indeterminate={areEntitiesIndeterminate()}
                          onChange={(_event, _checked) => {
                            setSelectedEntities(areEntitiesIndeterminate() ? [] : data.map(item => item[dataKey]));
                          }}
                        />
                      </TableCell>
                    )}
                    {headerCells.map(cell => {
                      const isBasicKey = typeof cell !== 'object';
                      const key = isBasicKey ? cell : 'key' in cell ? cell.key : ''; // it's a placegolder cell
                      if (renderHeaderCell) {
                        return renderHeaderCell(key as EntityKey, data);
                      }
                      const label = isBasicKey ? String(cell) : 'label' in cell ? cell.label : '';
                      const textAlignment: TableCellProps['align'] =
                        !isBasicKey && 'align' in cell ? cell.align : 'left';
                      return (
                        <TableCell
                          key={typeof key === 'string' ? key : key.toString()}
                          sx={{
                            backgroundColor: theme => lighten(theme.palette.background.paper, 3.35 * 0.025),
                          }}
                          align={textAlignment}
                        >
                          <Typography variant="body1" fontWeight="bolder">
                            {label}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((item, _idx, dataList) => {
                    const key = dataKey;
                    const isRowSelected = isSelected(item, selectedEntites);
                    const primaryKey = item[key];
                    return (
                      <TableRow key={item[key] as React.Key}>
                        {withSelection && (
                          <TableCell sx={{width: '1%', whiteSpace: 'nowrap'}}>
                            <Checkbox
                              checked={isRowSelected}
                              onChange={() => {
                                setSelectedEntities(prev => {
                                  return isRowSelected ? prev.filter(pk => pk !== primaryKey) : [...prev, primaryKey];
                                });
                              }}
                            />
                          </TableCell>
                        )}
                        {renderRow(key, item, dataList)}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card.Body>
        <Card.Footer sx={{px: 2}}>
          <ActionPaper sx={{width: 'fit-content', ml: 'auto', mt: 2}}>
            <Pagination {...pagination} />
          </ActionPaper>
        </Card.Footer>
      </Card>

      <SelectedEntitiesActionPopup
        isShown={amountOfSelectedEntities > 0 && onDeleteSelectedEntities !== undefined}
        amountOfSelectedEntities={amountOfSelectedEntities}
        isAppDrawerCurrentlyOpen={isAppDrawerCurrentlyOpen}
      >
        {onDeleteSelectedEntities && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteRounded />}
            sx={{ml: 3}}
            onClick={() => {
              onDeleteSelectedEntities(selectedEntites);
              clearSelectedEntities();
            }}
          >
            Delete
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          color="info"
          startIcon={<CloudDownload />}
          sx={{ml: 1}}
          onClick={() => {
            const targetEntities = data.filter(item => isSelected(item, selectedEntites))
            downloadAsJson(targetEntities, `bb_${title}_${Formatter.date.formatWithPattern(new Date(), 'yyyy_mm_dd')}`);
            clearSelectedEntities();
          }}
        >
          Export
        </Button>
        <Button size="small" variant="outlined" color="secondary" sx={{ml: 1}} onClick={clearSelectedEntities}>
          Clear
        </Button>
      </SelectedEntitiesActionPopup>
    </>
  );
};
