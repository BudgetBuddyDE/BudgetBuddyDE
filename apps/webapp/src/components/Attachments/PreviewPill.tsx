'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {VisibilityRounded} from '@mui/icons-material';
import {alpha, Box, Typography, useTheme} from '@mui/material';

export type PreviewPillProps = {
  attachment: TAttachmentWithUrl;
  onClick: (attachment: TAttachmentWithUrl) => void;
};

export const PreviewPill: React.FC<PreviewPillProps> = ({attachment, onClick}) => {
  const theme = useTheme();
  return (
    <Box
      component="button"
      type="button"
      aria-label="View"
      onClick={() => onClick(attachment)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        border: 0,
        borderRadius: 999,
        px: 1.5,
        py: 0.75,
        color: 'common.white',
        backgroundColor: alpha(theme.palette.common.black, 0.72),
        cursor: 'pointer',
        font: 'inherit',
        '&:hover': {backgroundColor: alpha(theme.palette.common.black, 0.86)},
      }}
    >
      <VisibilityRounded fontSize="small" />
      <Typography component="span" variant="body2" fontWeight={600}>
        Preview
      </Typography>
    </Box>
  );
};
