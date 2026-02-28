'use client';

import {AddRounded, RefreshRounded} from '@mui/icons-material';
import {Box, Chip, Typography} from '@mui/material';
import type {GridColDef, GridPaginationModel, GridRowSelectionModel, GridSortModel} from '@mui/x-data-grid';
import {useCallback, useState} from 'react';
import {DataTable} from '@/components/Table';

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
};

const mockProducts: Product[] = [
  {id: 1, name: 'MacBook Pro 14"', category: 'Electronics', price: 2499, stock: 15, status: 'available'},
  {id: 2, name: 'iPhone 15 Pro', category: 'Electronics', price: 1199, stock: 3, status: 'low_stock'},
  {id: 3, name: 'AirPods Pro', category: 'Accessories', price: 279, stock: 0, status: 'out_of_stock'},
  {id: 4, name: 'iPad Air', category: 'Electronics', price: 799, stock: 22, status: 'available'},
  {id: 5, name: 'Magic Keyboard', category: 'Accessories', price: 349, stock: 8, status: 'available'},
  {id: 6, name: 'Studio Display', category: 'Displays', price: 1599, stock: 2, status: 'low_stock'},
  {id: 7, name: 'Mac Mini M2', category: 'Electronics', price: 699, stock: 12, status: 'available'},
  {id: 8, name: 'Apple Watch Ultra', category: 'Wearables', price: 899, stock: 0, status: 'out_of_stock'},
  {id: 9, name: 'HomePod Mini', category: 'Smart Home', price: 99, stock: 45, status: 'available'},
  {id: 10, name: 'MagSafe Charger', category: 'Accessories', price: 49, stock: 5, status: 'low_stock'},
];

const statusColors: Record<Product['status'], 'success' | 'warning' | 'error'> = {
  available: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
};

const statusLabels: Record<Product['status'], string> = {
  available: 'Verfügbar',
  low_stock: 'Wenig Bestand',
  out_of_stock: 'Ausverkauft',
};

export default function DataTableDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({page: 0, pageSize: 5});
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({type: 'include', ids: new Set()});

  const columns: GridColDef<Product>[] = [
    {field: 'id', headerName: 'ID', width: 70},
    {field: 'name', headerName: 'Produkt', flex: 1, minWidth: 180},
    {field: 'category', headerName: 'Kategorie', width: 130},
    {
      field: 'price',
      headerName: 'Preis',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => `${value.toFixed(2)} €`,
    },
    {
      field: 'stock',
      headerName: 'Bestand',
      width: 100,
      type: 'number',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: params => (
        <Chip
          size="small"
          label={statusLabels[params.value as Product['status']]}
          color={statusColors[params.value as Product['status']]}
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
        DataTable Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
        MUI-X DataGrid basierte Tabelle mit Sortierung, Paginierung und Checkbox-Selektion.
      </Typography>

      <DataTable
        data={mockProducts}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Keine Produkte gefunden"
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
          title: 'Produkte',
          subtitle: `${selectionModel.ids.size} ausgewählt`,
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
              label: 'Produkt hinzufügen',
              onClick: () => alert('Neues Produkt'),
            },
          ],
        }}
      />

      {selectionModel.ids.size > 0 && (
        <Typography variant="body2" sx={{mt: 2}}>
          Ausgewählte IDs: {Array.from(selectionModel.ids).join(', ')}
        </Typography>
      )}
    </Box>
  );
}
