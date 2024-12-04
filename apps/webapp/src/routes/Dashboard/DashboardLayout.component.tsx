import {Grid2 as Grid, ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {ContentGrid} from '@/components/Layout';
import {useAuthContext} from '@/features/Auth';
import {withAuthLayout} from '@/features/Auth/Layout/withAuthLayout.hoc';

import {DashboardViewDescriptionMapping, DashboardViewMapping, type TDashboardView} from './index';

export type TDashboardLayoutProps = React.PropsWithChildren<{
  useOutletInsteadOfChildren?: boolean;
}>;

const DashboardLayout: React.FC<TDashboardLayoutProps> = ({children, useOutletInsteadOfChildren = false}) => {
  const {sessionUser} = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  if (!sessionUser) return null;
  return (
    <ContentGrid
      title={`Welcome, ${sessionUser.name ? sessionUser.name : sessionUser.username}!`}
      description={DashboardViewDescriptionMapping[DashboardViewMapping[location.pathname]]}>
      <Grid size={{xs: 12}}>
        <ActionPaper
          sx={{
            width: 'min-content',
            maxWidth: '100%',
            overflowX: 'scroll',
            '::-webkit-scrollbar': {
              display: 'none',
            },
            '-ms-overflow-style': 'none',
            scrollbarWidth: 'none',
          }}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={location.pathname}
            onChange={(event: React.BaseSyntheticEvent) => {
              const newPath = event.target.value;
              if (location.pathname === newPath) return;
              navigate(newPath);
            }}
            exclusive>
            {Object.entries(DashboardViewMapping).map(([path, view]: [string, TDashboardView]) => (
              <ToggleButton key={path} value={path}>
                {/* {React.isValidElement(DashboardViewIconMapping[view]) &&
                  React.cloneElement(DashboardViewIconMapping[view], {
                    // @ts-expect-error
                    sx: {
                      mr: 0.5,
                    },
                  })} */}
                {view.substring(0, 1).toUpperCase() + view.substring(1)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </ActionPaper>
      </Grid>

      {useOutletInsteadOfChildren ? <Outlet /> : children}
    </ContentGrid>
  );
};

export default withAuthLayout(DashboardLayout);
