import {Box, Button, Stack, Typography} from '@mui/material';
import Link from 'next/link';

export default function DemoPage() {
  const demos = [
    {
      title: 'BasicTable',
      description: 'Einfache Tabelle basierend auf MUI Table Komponenten mit konfigurierbarer Toolbar.',
      href: '/demo/basic-table',
    },
    {
      title: 'EntityTable',
      description: 'Erweitert BasicTable mit Slice-Integration für automatisches Daten-Fetching.',
      href: '/demo/entity-table',
    },
    {
      title: 'DataTable',
      description: 'Basiert auf MUI-X DataGrid mit Paginierung, Sortierung und Filterung.',
      href: '/demo/data-table',
    },
    {
      title: 'EntityDataTable',
      description: 'Kombiniert DataTable mit Slice-Integration für Server-Side Features.',
      href: '/demo/entity-data-table',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Table Components Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{mb: 4}}>
        Übersicht der neuen Tabellen-Komponenten. Klicke auf eine Komponente, um die Demo anzusehen.
      </Typography>

      <Stack direction={{xs: 'column', md: 'row'}} spacing={3} flexWrap="wrap" useFlexGap>
        {demos.map(demo => (
          <Box
            key={demo.href}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              flex: {xs: '1 1 100%', md: '1 1 calc(50% - 12px)'},
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {demo.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 2, flexGrow: 1}}>
              {demo.description}
            </Typography>
            <Button component={Link} href={demo.href} variant="outlined" size="small">
              Demo ansehen
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
