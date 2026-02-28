'use client';

import {AddRounded, CloudDownloadRounded, RefreshRounded} from '@mui/icons-material';
import {Box, Chip, Typography} from '@mui/material';
import React, {useState} from 'react';
import {BasicTable, type ColumnDefinition} from '@/components/Table';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
};

const mockUsers: User[] = [
  {id: 1, name: 'Max Mustermann', email: 'max@example.com', role: 'Admin', status: 'active', joinedAt: '2024-01-15'},
  {id: 2, name: 'Anna Schmidt', email: 'anna@example.com', role: 'User', status: 'active', joinedAt: '2024-02-20'},
  {
    id: 3,
    name: 'Peter Weber',
    email: 'peter@example.com',
    role: 'Moderator',
    status: 'inactive',
    joinedAt: '2023-11-10',
  },
  {id: 4, name: 'Lisa Müller', email: 'lisa@example.com', role: 'User', status: 'pending', joinedAt: '2024-03-01'},
  {id: 5, name: 'Thomas Bauer', email: 'thomas@example.com', role: 'User', status: 'active', joinedAt: '2024-01-28'},
];

const statusColors: Record<User['status'], 'success' | 'error' | 'warning'> = {
  active: 'success',
  inactive: 'error',
  pending: 'warning',
};

export default function BasicTableDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const columns: ColumnDefinition<User>[] = [
    {key: 'id', label: 'ID', width: 70},
    {key: 'name', label: 'Name'},
    {key: 'email', label: 'E-Mail'},
    {key: 'role', label: 'Rolle'},
    {
      key: 'status',
      label: 'Status',
      renderCell: value => <Chip size="small" label={String(value)} color={statusColors[value as User['status']]} />,
    },
    {key: 'joinedAt', label: 'Beigetreten'},
  ];

  const filteredUsers = React.useMemo(() => {
    return mockUsers.filter(
      user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        BasicTable Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
        Einfache Tabelle mit konfigurierbarer Toolbar, Suche und Action-Buttons.
      </Typography>

      <BasicTable
        data={filteredUsers}
        dataKey="id"
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Keine Benutzer gefunden"
        toolbar={{
          title: 'Benutzer',
          subtitle: 'Alle registrierten Benutzer',
          showSearch: true,
          searchPlaceholder: 'Benutzer suchen...',
          onSearch: setSearchTerm,
          actions: [
            {
              id: 'refresh',
              icon: <RefreshRounded />,
              label: 'Aktualisieren',
              onClick: handleRefresh,
            },
            {
              id: 'export',
              icon: <CloudDownloadRounded />,
              label: 'Exportieren',
              onClick: () => alert('Export gestartet'),
            },
            {
              id: 'add',
              icon: <AddRounded />,
              label: 'Benutzer hinzufügen',
              onClick: () => alert('Benutzer hinzufügen'),
            },
          ],
        }}
        onRowClick={(user, index) => alert(`Zeile ${index + 1}: ${user.name}`)}
      />
    </Box>
  );
}
