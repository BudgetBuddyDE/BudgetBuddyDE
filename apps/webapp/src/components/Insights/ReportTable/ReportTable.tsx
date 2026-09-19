import {Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';

export type ReportTableProps = {
  headers: string[];
  rows: string[][];
  rightAlignedColumns?: number[];
};

export const ReportTable: React.FC<ReportTableProps> = ({headers, rows, rightAlignedColumns = []}) => {
  return (
    <Card variant="outlined" sx={{overflowX: 'auto', p: 0}}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((header, index) => (
              <TableCell key={header} align={rightAlignedColumns.includes(index) ? 'right' : 'left'}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length ? (
            rows.map((row, index) => (
              <TableRow key={index}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} align={rightAlignedColumns.includes(cellIndex) ? 'right' : 'left'}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length}>No data for the selected filters.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
