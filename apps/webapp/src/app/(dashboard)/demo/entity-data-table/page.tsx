'use client';

import {AddRounded, RefreshRounded} from '@mui/icons-material';
import {Box, Chip, Typography} from '@mui/material';
import type {GridColDef, GridPaginationModel, GridRowSelectionModel, GridSortModel} from '@mui/x-data-grid';
import {useCallback, useMemo, useState} from 'react';
import {EntityDataTable, type EntitySlice} from '@/components/Table';

type Invoice = {
  id: number;
  invoiceNumber: string;
  customer: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
};

const mockInvoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    customer: 'Acme Corp',
    amount: 5250,
    date: '2024-02-01',
    dueDate: '2024-03-01',
    status: 'paid',
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    customer: 'TechStart GmbH',
    amount: 3800,
    date: '2024-02-05',
    dueDate: '2024-03-05',
    status: 'pending',
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    customer: 'Digital Solutions',
    amount: 12500,
    date: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'overdue',
  },
  {
    id: 4,
    invoiceNumber: 'INV-2024-004',
    customer: 'Cloud Nine Ltd',
    amount: 890,
    date: '2024-02-20',
    dueDate: '2024-03-20',
    status: 'draft',
  },
  {
    id: 5,
    invoiceNumber: 'INV-2024-005',
    customer: 'Startup Hub',
    amount: 4200,
    date: '2024-02-18',
    dueDate: '2024-03-18',
    status: 'pending',
  },
  {
    id: 6,
    invoiceNumber: 'INV-2024-006',
    customer: 'Innovation Labs',
    amount: 7650,
    date: '2024-01-28',
    dueDate: '2024-02-28',
    status: 'paid',
  },
  {
    id: 7,
    invoiceNumber: 'INV-2024-007',
    customer: 'Future Tech AG',
    amount: 15800,
    date: '2024-01-10',
    dueDate: '2024-02-10',
    status: 'overdue',
  },
  {
    id: 8,
    invoiceNumber: 'INV-2024-008',
    customer: 'Smart Systems',
    amount: 2340,
    date: '2024-02-25',
    dueDate: '2024-03-25',
    status: 'draft',
  },
  {
    id: 9,
    invoiceNumber: 'INV-2024-009',
    customer: 'Data Dynamics',
    amount: 6700,
    date: '2024-02-12',
    dueDate: '2024-03-12',
    status: 'pending',
  },
  {
    id: 10,
    invoiceNumber: 'INV-2024-010',
    customer: 'Web Wizards',
    amount: 1890,
    date: '2024-02-08',
    dueDate: '2024-03-08',
    status: 'paid',
  },
];

const statusColors: Record<Invoice['status'], 'success' | 'warning' | 'error' | 'default'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
  draft: 'default',
};

const statusLabels: Record<Invoice['status'], string> = {
  paid: 'Bezahlt',
  pending: 'Ausstehend',
  overdue: 'Überfällig',
  draft: 'Entwurf',
};

export default function EntityDataTableDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({page: 0, pageSize: 5});
  const [sortModel, setSortModel] = useState<GridSortModel>([{field: 'date', sort: 'desc'}]);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({type: 'include', ids: new Set()});

  // Simulated slice (würde normalerweise von Redux kommen)
  const slice: EntitySlice<Invoice> = useMemo(
    () => ({
      data: mockInvoices,
      isLoading,
      error: null,
      totalCount: mockInvoices.length,
    }),
    [isLoading],
  );

  const columns: GridColDef<Invoice>[] = [
    {field: 'invoiceNumber', headerName: 'Rechnungsnr.', width: 140},
    {field: 'customer', headerName: 'Kunde', flex: 1, minWidth: 150},
    {
      field: 'amount',
      headerName: 'Betrag',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) => `${value.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`,
    },
    {field: 'date', headerName: 'Datum', width: 110},
    {field: 'dueDate', headerName: 'Fällig', width: 110},
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: params => (
        <Chip
          size="small"
          label={statusLabels[params.value as Invoice['status']]}
          color={statusColors[params.value as Invoice['status']]}
        />
      ),
    },
  ];

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const totalAmount = useMemo(() => {
    const selectedIds = Array.from(selectionModel.ids) as number[];
    const selectedInvoices = mockInvoices.filter(inv => selectedIds.includes(inv.id));
    return selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  }, [selectionModel]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        EntityDataTable Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
        Kombiniert DataGrid mit Slice-Integration. Ideal für Server-Side Pagination und Filtering.
      </Typography>

      <EntityDataTable
        slice={slice}
        columns={columns}
        emptyMessage="Keine Rechnungen gefunden"
        height={500}
        checkboxSelection
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={setSelectionModel}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 25]}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        toolbar={{
          title: 'Rechnungen',
          showCount: true,
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
              label: 'Rechnung erstellen',
              onClick: () => alert('Neue Rechnung'),
            },
          ],
        }}
      />

      {selectionModel.ids.size > 0 && (
        <Box
          sx={{mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider'}}
        >
          <Typography variant="body2">
            <strong>{selectionModel.ids.size}</strong> Rechnungen ausgewählt
          </Typography>
          <Typography variant="h6" color="primary">
            Gesamtsumme: {totalAmount.toLocaleString('de-DE', {minimumFractionDigits: 2})} €
          </Typography>
        </Box>
      )}
    </Box>
  );
}
