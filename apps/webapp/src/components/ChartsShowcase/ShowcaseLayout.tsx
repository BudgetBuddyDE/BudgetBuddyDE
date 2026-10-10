'use client';

import {Box, Grid, Typography, Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';

export type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  note?: string;
};

export const ChartCard: React.FC<ChartCardProps> = ({title, subtitle, children, note}) => {
  const headingId = React.useId();
  const elements = React.Children.toArray(children);
  const child = elements.find(React.isValidElement) as
    React.ReactElement<{data?: unknown[]; series?: {data?: unknown[]}[]}> | undefined;
  const source = child?.props.data;
  const flatten = (node: unknown, parent = ''): Record<string, unknown>[] => {
    if (!node || typeof node !== 'object') return [];
    const record = node as Record<string, unknown>;
    const children = record.children;
    if (Array.isArray(children)) return children.flatMap(item => flatten(item, String(record.name ?? parent)));
    return [{...record, ...(parent ? {parent} : {})}];
  };
  const rows = Array.isArray(source)
    ? source.flatMap(row => flatten(row))
    : source && typeof source === 'object'
      ? 'nodes' in source
        ? [...(source as {nodes: unknown[]}).nodes, ...((source as {links?: unknown[]}).links ?? [])]
        : flatten(source)
      : (child?.props.series?.flatMap(series => series.data ?? []) ?? []);
  const records = rows.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null);
  const columns = Array.from(new Set(records.flatMap(row => Object.keys(row)))).filter(key =>
    records.some(row => typeof row[key] !== 'object'),
  );
  return (
    <Card
      component="figure"
      aria-labelledby={headingId}
      sx={{height: '100%', m: 0, p: {xs: 2, md: 3}, border: 1, borderColor: 'divider'}}
    >
      <Card.Header>
        <Box>
          <Card.Title id={headingId} component="h3">
            {title}
          </Card.Title>
          {subtitle && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>
      </Card.Header>
      <Card.Body sx={{pt: 2, minWidth: 0}}>{children}</Card.Body>
      {note && (
        <Typography component="figcaption" variant="body2" color="text.secondary" sx={{mt: 2, maxWidth: '65ch'}}>
          {note}
        </Typography>
      )}
      {records.length > 0 && (
        <Box
          component="details"
          sx={{
            mt: 2,
            '& summary': {cursor: 'pointer', color: 'text.secondary', fontSize: 14},
            '& table': {fontVariantNumeric: 'tabular-nums'},
          }}
        >
          <summary>View data</summary>
          <Box sx={{overflowX: 'auto', mt: 1}}>
            <Table size="small" aria-label={`${title} data`}>
              <TableHead>
                <TableRow>
                  {columns.map(key => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map(key => (
                      <TableCell key={key} align={typeof row[key] === 'number' ? 'right' : 'left'}>
                        {row[key] === null || row[key] === undefined ? 'No data' : String(row[key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export type ShowcaseSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({title, description, children}) => {
  return (
    <Box component="section" id={title.toLowerCase().replace(/[^a-z]+/g, '-')} sx={{mb: 5, scrollMarginTop: 24}}>
      <Typography component="h2" variant="h5" sx={{fontWeight: 700, mb: 0.5}}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
          {description}
        </Typography>
      )}
      <Grid container spacing={3}>
        {children}
      </Grid>
    </Box>
  );
};
