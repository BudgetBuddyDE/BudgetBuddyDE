import {type TTransaction} from '@budgetbuddyde/types';
import {AddRounded, DeleteRounded, EditRounded} from '@mui/icons-material';
import {Avatar, AvatarGroup, Checkbox, IconButton, Stack, TableCell, TableRow, Typography} from '@mui/material';
import {format, isSameYear} from 'date-fns';
import React from 'react';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {Linkify} from '@/components/Base/Link';
import {Menu} from '@/components/Base/Menu';
import {SearchInput} from '@/components/Base/SearchInput';
import {type ISelectionHandler} from '@/components/Base/SelectAll';
import {type TTableSelectionProps, Table} from '@/components/Base/Table';
import {ToggleFilterDrawerButton, useFilterStore} from '@/components/Filter';
import {When} from '@/components/When';
import {useAuthContext} from '@/features/Auth';
import {CategoryChip} from '@/features/Category';
import {PaymentMethodChip} from '@/features/PaymentMethod';
import {pb} from '@/pocketbase';
import {DescriptionTableCellStyle} from '@/style/DescriptionTableCell.style';
import {downloadAsJson, filterTransactions} from '@/utils';

import {useTransactions} from '../useTransactions.hook';

export type TTransactionTableProps = {
  isLoading?: boolean;
  onAddTransaction?: () => void;
  onAddMultiple?: () => void;
  onEditTransaction?: (transaction: TTransaction) => void;
  onDeleteTransaction?: (transaction: TTransaction) => void;
  onOpenImage?: (fileName: string, fileUrl: string) => void;
} & TTableSelectionProps<TTransaction> &
  Pick<ISelectionHandler<TTransaction>, 'onSelect' | 'isSelected'>;

export const TransactionTable: React.FC<TTransactionTableProps> = ({
  isLoading = false,
  onAddTransaction,
  onAddMultiple,
  onEditTransaction,
  onDeleteTransaction,
  onOpenImage,
  amountOfSelectedEntities,
  onSelectAll,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const {fileToken} = useAuthContext();
  const {filters} = useFilterStore();
  const {isLoading: isLoadingTransactions, data: transactions} = useTransactions();
  const [keyword, setKeyword] = React.useState<string>('');

  const displayedTransactions: TTransaction[] = React.useMemo(() => {
    return filterTransactions(keyword, filters, transactions ?? []);
  }, [keyword, filters, transactions]);

  return (
    <Table<TTransaction>
      title="Transactions"
      subtitle="Manage your transactions"
      isLoading={isLoading || isLoadingTransactions}
      data={displayedTransactions}
      withSelection
      amountOfSelectedEntities={amountOfSelectedEntities}
      onSelectAll={onSelectAll}
      onDelete={onDelete}
      headerCells={['Date', 'Details', 'Amount', 'Information', 'Files', '']}
      renderRow={transaction => {
        return (
          <TableRow
            key={transaction.id}
            sx={{
              '&:last-child td, &:last-child th': {border: 0},
              whiteSpace: 'nowrap',
            }}>
            <TableCell size={AppConfig.table.cellSize}>
              <Checkbox checked={isSelected(transaction)} onChange={() => onSelect(transaction)} />
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <Typography variant="body1" fontWeight={'bolder'}>
                {format(
                  new Date(transaction.processed_at),
                  isSameYear(transaction.processed_at, new Date()) ? 'dd.MM' : 'dd.MM.yyyy',
                )}
              </Typography>
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <Stack>
                <Typography variant="body1" fontWeight={'bolder'}>
                  {transaction.receiver}
                </Typography>
                <Stack direction="row" spacing={AppConfig.baseSpacing / 4}>
                  <CategoryChip category={transaction.expand.category} size="small" />
                  <PaymentMethodChip paymentMethod={transaction.expand.payment_method} size="small" />
                </Stack>
              </Stack>
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <Typography variant="body1">
                {transaction.transfer_amount.toLocaleString('de', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </Typography>
            </TableCell>
            <TableCell sx={DescriptionTableCellStyle} size={AppConfig.table.cellSize}>
              <Linkify>{transaction.information ?? 'No information available'}</Linkify>
            </TableCell>
            <TableCell size={AppConfig.table.cellSize}>
              <AvatarGroup max={4} variant="rounded">
                {transaction.attachments?.map(fileName => (
                  <Avatar
                    key={fileName}
                    variant="rounded"
                    alt={fileName}
                    src={pb.files.getUrl(transaction, fileName, {token: fileToken})}
                    sx={{
                      ':hover': {
                        zIndex: 1,
                        transform: 'scale(1.1)',
                        transition: 'transform 0.2s ease-in-out',
                      },
                    }}
                    onClick={() =>
                      onOpenImage && onOpenImage(fileName, pb.files.getUrl(transaction, fileName, {token: fileToken}))
                    }
                  />
                ))}
              </AvatarGroup>
            </TableCell>
            <TableCell align="right" size={AppConfig.table.cellSize}>
              <ActionPaper sx={{width: 'fit-content', ml: 'auto'}}>
                <IconButton color="primary" onClick={() => onEditTransaction && onEditTransaction(transaction)}>
                  <EditRounded />
                </IconButton>
                <IconButton color="primary" onClick={() => onDeleteTransaction && onDeleteTransaction(transaction)}>
                  <DeleteRounded />
                </IconButton>
              </ActionPaper>
            </TableCell>
          </TableRow>
        );
      }}
      tableActions={
        <React.Fragment>
          <ToggleFilterDrawerButton />
          <SearchInput placeholder="Search" onSearch={setKeyword} />
          <When when={onAddTransaction}>
            <IconButton color="primary" onClick={onAddTransaction}>
              <AddRounded fontSize="inherit" />
            </IconButton>
          </When>

          <When when={onAddMultiple}>
            <Menu
              useIconButton
              actions={[
                {
                  children: 'Create multiple',
                  onClick: onAddMultiple,
                },
                {
                  children: 'Export',
                  onClick: () => {
                    downloadAsJson(displayedTransactions, `bb_transactions_${format(new Date(), 'yyyy_mm_dd')}`);
                  },
                },
              ]}
            />
          </When>
        </React.Fragment>
      }
    />
  );
};
