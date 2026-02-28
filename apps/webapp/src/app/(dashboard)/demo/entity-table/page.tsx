'use client';

import {AddRounded, RefreshRounded} from '@mui/icons-material';
import {Box, Chip, Typography} from '@mui/material';
import {useCallback, useMemo, useState} from 'react';
import {type ColumnDefinition, type EntitySlice, EntityTable} from '@/components/Table';

type Transaction = {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
};

const mockTransactions: Transaction[] = [
  {id: 1, description: 'Gehalt', amount: 3500, category: 'Einkommen', date: '2024-03-01', type: 'income'},
  {id: 2, description: 'Miete', amount: -1200, category: 'Wohnen', date: '2024-03-02', type: 'expense'},
  {id: 3, description: 'Supermarkt', amount: -85.5, category: 'Lebensmittel', date: '2024-03-03', type: 'expense'},
  {id: 4, description: 'Freelance Projekt', amount: 750, category: 'Einkommen', date: '2024-03-05', type: 'income'},
  {id: 5, description: 'Netflix', amount: -12.99, category: 'Unterhaltung', date: '2024-03-07', type: 'expense'},
  {id: 6, description: 'Tankstelle', amount: -65, category: 'Transport', date: '2024-03-08', type: 'expense'},
  {id: 7, description: 'Restaurant', amount: -45.8, category: 'Essen', date: '2024-03-10', type: 'expense'},
  {id: 8, description: 'Dividenden', amount: 125, category: 'Einkommen', date: '2024-03-12', type: 'income'},
  {id: 9, description: 'Versicherung', amount: -180, category: 'Versicherungen', date: '2024-03-15', type: 'expense'},
  {id: 10, description: 'Sport Abo', amount: -30, category: 'Gesundheit', date: '2024-03-16', type: 'expense'},
  {id: 11, description: 'Bonus', amount: 500, category: 'Einkommen', date: '2024-03-18', type: 'income'},
  {id: 12, description: 'Stromrechnung', amount: -95, category: 'Wohnen', date: '2024-03-20', type: 'expense'},
];

export default function EntityTableDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Simulated slice (würde normalerweise von Redux kommen)
  const slice: EntitySlice<Transaction> = useMemo(() => {
    const filtered = mockTransactions.filter(
      t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    const start = page * rowsPerPage;
    const paginatedData = filtered.slice(start, start + rowsPerPage);

    return {
      data: paginatedData,
      isLoading,
      error: null,
      totalCount: filtered.length,
    };
  }, [isLoading, searchTerm, page, rowsPerPage]);

  const columns: ColumnDefinition<Transaction>[] = [
    {key: 'date', label: 'Datum', width: 100},
    {key: 'description', label: 'Beschreibung'},
    {key: 'category', label: 'Kategorie'},
    {
      key: 'amount',
      label: 'Betrag',
      align: 'right',
      renderCell: (value, row) => (
        <Typography color={row.type === 'income' ? 'success.main' : 'error.main'} fontWeight="medium">
          {row.type === 'income' ? '+' : ''}
          {Number(value).toFixed(2)} €
        </Typography>
      ),
    },
    {
      key: 'type',
      label: 'Typ',
      renderCell: value => (
        <Chip
          size="small"
          label={value === 'income' ? 'Einnahme' : 'Ausgabe'}
          color={value === 'income' ? 'success' : 'error'}
          variant="outlined"
        />
      ),
    },
  ];

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        EntityTable Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
        Tabelle mit Slice-Integration für Daten-Fetching, Paginierung und Suche.
      </Typography>

      <EntityTable
        slice={slice}
        dataKey="id"
        columns={columns}
        emptyMessage="Keine Transaktionen gefunden"
        maxHeight={600}
        toolbar={{
          title: 'Transaktionen',
          showCount: true,
          showSearch: true,
          searchPlaceholder: 'Transaktion suchen...',
          onSearch: text => {
            setSearchTerm(text);
            setPage(0);
          },
          actions: [
            {
              id: 'refresh',
              icon: <RefreshRounded />,
              label: 'Aktualisieren',
              onClick: handleRefresh,
            },
            {
              id: 'add',
              icon: <AddRounded />,
              label: 'Transaktion hinzufügen',
              onClick: () => alert('Neue Transaktion'),
            },
          ],
        }}
        pagination={{
          page,
          rowsPerPage,
          rowsPerPageOptions: [5, 8, 10, 25],
          onPageChange: setPage,
          onRowsPerPageChange: newRowsPerPage => {
            setRowsPerPage(newRowsPerPage);
            setPage(0);
          },
        }}
      />
    </Box>
  );
}
