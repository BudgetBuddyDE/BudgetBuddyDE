'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import DownloadIcon from '@mui/icons-material/Download';
import {Alert, Box, CircularProgress, IconButton, Paper, Tooltip, Typography} from '@mui/material';
import React from 'react';
import {attachmentSlice} from '@/lib/features/attachments/attachmentSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {AttachmentViewDialog} from '../AttachmentViewDialog';

export const AttachmentTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const {status, error, data: attachments} = useAppSelector(attachmentSlice.selectors.getState);
  const [viewAttachment, setViewAttachment] = React.useState<TAttachmentWithUrl | null>(null);

  React.useEffect(() => {
    dispatch(attachmentSlice.actions.getPage({page: 0, rowsPerPage: 100}));
  }, [dispatch]);

  const handleDownload = (attachment: TAttachmentWithUrl) => {
    const link = document.createElement('a');
    link.href = attachment.signedUrl;
    link.download = attachment.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === 'loading') {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const sortedAttachments = [...(attachments ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (sortedAttachments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 6}}>
        No attachments found.
      </Typography>
    );
  }

  return (
    <>
      <Paper variant="outlined" sx={{overflow: 'hidden'}}>
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th, & td': {
              px: 2,
              py: 1.5,
              textAlign: 'left',
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& th': {typography: 'body2', fontWeight: 'bold', color: 'text.secondary'},
          }}
        >
          <thead>
            <tr>
              <th>Preview</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {sortedAttachments.map(attachment => {
              const isImage = attachment.contentType.startsWith('image/');
              return (
                <tr key={attachment.id}>
                  <td style={{width: 64}}>
                    {isImage ? (
                      <Box
                        component="img"
                        src={attachment.signedUrl}
                        alt={attachment.fileName}
                        sx={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          display: 'block',
                        }}
                        onClick={() => setViewAttachment(attachment)}
                      />
                    ) : (
                      <Box
                        sx={{width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {attachment.fileExtension.toUpperCase()}
                        </Typography>
                      </Box>
                    )}
                  </td>
                  <td>
                    <Typography variant="body2">{attachment.fileName}</Typography>
                  </td>
                  <td>
                    <Typography variant="body2" color="text.secondary">
                      {attachment.contentType}
                    </Typography>
                  </td>
                  <td>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(attachment.createdAt).toLocaleDateString()}
                    </Typography>
                  </td>
                  <td style={{width: 48, textAlign: 'right'}}>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => handleDownload(attachment)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Box>
      </Paper>

      <AttachmentViewDialog
        open={viewAttachment !== null}
        attachment={viewAttachment}
        onClose={() => setViewAttachment(null)}
      />
    </>
  );
};
