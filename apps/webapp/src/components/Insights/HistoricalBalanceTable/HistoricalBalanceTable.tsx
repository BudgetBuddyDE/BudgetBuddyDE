'use client';

import React from 'react';
import {Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';
import {ActionPaper} from '@/components/ActionPaper';
import {Formatter} from '@/utils/Formatter';
import {Card} from "@/components/Card";

type HistoricalTableType = 'BASIC' | 'GROUPED_BY_CATEGORY';

export type HistoricalBalanceTableProps = {
  type: HistoricalTableType;
  dense?: boolean;
};

type HistoricalBalanceRow = {
  date: Date;
  category?: string;
  income: number;
  expenses: number;
  balance: number;
};

const rows: HistoricalBalanceRow[] = [
  {date: new Date(2026, 0, 1), category: 'Investment', income: 3500, expenses: 2800, balance: 700},
  {date: new Date(2026, 1, 1), category: 'Investment', income: 3500, expenses: 3200, balance: 300},
  {date: new Date(2026, 2, 1), category: 'Investment', income: 4000, expenses: 2900, balance: 1100},
];

const formatPeriod = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {year: 'numeric', month: 'short'});
};

export const HistoricalBalanceTable: React.FC<HistoricalBalanceTableProps> = ({type, dense = false}) => {
  const showCategory = type === 'GROUPED_BY_CATEGORY';

  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Stack>
          <Card.Title>Historical balance</Card.Title>
          <Card.Subtitle>{showCategory ? "Grouped by date and category" : "Grouped by date"}</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        <TableContainer component={ActionPaper}>
          <Table size={dense ? 'small' : 'medium'} aria-label="historical balance table">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                {showCategory && <TableCell>Category</TableCell>}
                <TableCell align="right">Income</TableCell>
                <TableCell align="right">Expenses</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.date.getTime()}-${index}`} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                  <TableCell component="th" scope="row">
                    {formatPeriod(row.date)}
                  </TableCell>
                  {showCategory && <TableCell>{row.category || '-'}</TableCell>}
                  <TableCell align="right">{Formatter.currency.formatBalance(row.income)}</TableCell>
                  <TableCell align="right">{Formatter.currency.formatBalance(row.expenses)}</TableCell>
                  <TableCell align="right">{Formatter.currency.formatBalance(row.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card.Body>
    </Card>
  );
};
