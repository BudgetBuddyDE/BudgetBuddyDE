import {Box, type BoxProps} from '@mui/material';
import React from 'react';

export type TTabPanelProps = React.PropsWithChildren<
  {
    idx: number;
    value: number;
  } & BoxProps
>;

/**
 * Renders a tab panel component.
 *
 * @see https://mui.com/material-ui/react-tabs/#introduction
 *
 * @component
 * @example
 * ```tsx
 * <TabPanel idx={0} value={selectedTab}>
 *   <TabContent1 />
 * </TabPanel>
 * ```
 *
 * @param {TTabPanelProps} props - The props for the TabPanel component.
 * @param {React.ReactNode} props.children - The content to be rendered inside the tab panel.
 * @param {number} props.idx - The index of the tab panel.
 * @param {number} props.value - The currently selected tab index.
 * @param {BoxProps} props.boxProps - Additional props to be spread on the Box component.
 * @returns {React.ReactElement} The rendered TabPanel component.
 */
export const TabPanel: React.FC<TTabPanelProps> = ({children, idx, value, ...boxProps}) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== idx}
      id={`tab-panel-${idx}`}
      aria-labelledby={`tab-panel-${idx}`}
      {...boxProps}>
      {value === idx && children}
    </Box>
  );
};
