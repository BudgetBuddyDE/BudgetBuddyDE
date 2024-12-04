import {type TDividendDetails, type TTimeframe} from '@budgetbuddyde/types';
import {Stack, TableCell, TableRow, Typography} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';
import {useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {Image} from '@/components/Base/Image';
import {type TTableProps, Table} from '@/components/Base/Table';
import {useStockPositions} from '@/features/Stocks/hooks';

import {StockPrice} from '../../StockPrice';
import {StockService} from '../../StockService';

const SEPERATOR = '•';

export type TDividendTableProps = {
  dividends: TDividendDetails[];
  withRedirect?: boolean;
} & Pick<TTableProps<TDividendDetails>, 'isLoading'>;

export const DividendTable: React.FC<TDividendTableProps> = ({dividends, withRedirect = false, ...tableProps}) => {
  const navigate = useNavigate();
  const {isLoading: isLoadingStockPositions, data: stockPositions} = useStockPositions();

  const futureDividends = React.useMemo(() => {
    return StockService.transformDividendDetails(dividends);
  }, [dividends]);

  return (
    <Table<(typeof futureDividends)[0]>
      data={futureDividends}
      title="Dividends"
      headerCells={['Company', 'Ex-Date', 'Payment-Date', 'Price', 'Total']}
      renderHeaderCell={headerCell => (
        <TableCell key={headerCell.replaceAll(' ', '_').toLowerCase()} size={AppConfig.table.cellSize}>
          <Typography fontWeight="bolder">{headerCell}</Typography>
        </TableCell>
      )}
      renderRow={data => {
        const defaultTimeframe: TTimeframe = '3m';
        const matchingPositions = (stockPositions ?? []).filter(
          position => position.isin === data.companyInfo?.security.isin,
        );
        // matchingPosition = Array(matchingPositions).at(-1);
        const totalQuantity = matchingPositions.reduce((prev, cur) => prev + cur.quantity, 0);
        return (
          <TableRow
            key={data.key}
            {...(withRedirect && {
              sx: {
                ':hover': {
                  backgroundColor: theme => theme.palette.action.hover,
                  cursor: 'pointer',
                },
              },
              onClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
                e.stopPropagation();
                navigate(`/stocks/${data.companyInfo.security.isin}?timeframe=${defaultTimeframe}`);
              },
            })}>
            <TableCell>
              <Stack direction="row" alignItems={'center'}>
                <ActionPaper
                  sx={{
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    mr: 1.5,
                  }}>
                  <Image src={data.companyInfo.logo} sx={{width: 'inherit', height: 'inherit'}} />
                </ActionPaper>

                <Stack>
                  <Stack direction="row" spacing={AppConfig.baseSpacing / 4}>
                    <Typography variant="caption">{data.companyInfo.security.type}</Typography>
                    <Typography variant="caption">{SEPERATOR}</Typography>
                    <Typography variant="caption">{data.companyInfo.security.isin}</Typography>
                    <Typography variant="caption">{SEPERATOR}</Typography>
                    <Typography variant="caption">{data.companyInfo.security.wkn}</Typography>
                  </Stack>

                  <Typography variant="body1" fontWeight={'bolder'}>
                    {data.companyInfo.name}
                  </Typography>
                </Stack>
              </Stack>
            </TableCell>
            <TableCell>
              <Typography>{format(data.dividend.exDate, 'dd.MM.yy')}</Typography>
            </TableCell>
            <TableCell>
              <Typography>{format(data.dividend.paymentDate, 'dd.MM.yy')}</Typography>
            </TableCell>
            <TableCell>
              <StockPrice price={data.dividend.price} currency={data.dividend.currency} />
            </TableCell>
            <TableCell>
              <Stack>
                <Typography variant="caption">{totalQuantity}x</Typography>
                <StockPrice
                  price={totalQuantity * data.dividend.price}
                  currency={data.dividend.currency}
                  sx={{width: 'fit-content'}}
                />
              </Stack>
            </TableCell>
          </TableRow>
        );
      }}
      {...tableProps}
      isLoading={isLoadingStockPositions || tableProps.isLoading}
    />
  );
};
