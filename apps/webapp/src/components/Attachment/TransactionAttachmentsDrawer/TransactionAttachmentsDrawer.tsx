'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {AttachFileRounded} from '@mui/icons-material';
import {Box, Divider, Stack, Typography} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {CloseIconButton} from '@/components/Button';
import {Drawer} from '@/components/Drawer/Drawer';
import {useSnackbarContext} from '@/components/Snackbar';
import {AttachmentList} from '../AttachmentList';
import {AttachmentUploader} from '../AttachmentUploader';

export type TransactionAttachmentsDrawerProps = {
  open: boolean;
  transaction: Pick<TExpandedTransaction, 'id' | 'receiver' | 'processedAt'> | null;
  onClose: () => void;
};

export const TransactionAttachmentsDrawer: React.FC<TransactionAttachmentsDrawerProps> = ({
  open,
  transaction,
  onClose,
}) => {
  const {showSnackbar} = useSnackbarContext();
  const [attachments, setAttachments] = React.useState<TAttachmentWithUrl[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<Error | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());

  const fetchAttachments = React.useCallback(async () => {
    if (!transaction) return;
    setIsLoading(true);
    setFetchError(null);
    const [result, error] = await apiClient.backend.transaction.getTransactionAttachments(transaction.id);
    if (error) {
      setFetchError(error);
      setIsLoading(false);
      return;
    }
    setAttachments(result?.data ?? []);
    setIsLoading(false);
  }, [transaction]);

  React.useEffect(() => {
    if (open && transaction) {
      fetchAttachments();
    } else {
      setAttachments([]);
      setFetchError(null);
    }
  }, [open, transaction, fetchAttachments]);

  const handleUpload = async (files: File[]) => {
    if (!transaction) return;
    setIsUploading(true);
    const [result, error] = await apiClient.backend.transaction.uploadTransactionAttachments(transaction.id, files);
    setIsUploading(false);
    if (error) {
      showSnackbar({message: `Failed to upload attachments: ${error.message}`});
      return;
    }
    showSnackbar({message: `${files.length} attachment(s) uploaded successfully`});
    setAttachments(prev => [...prev, ...(result?.data ?? [])]);
  };

  const handleDelete = async (attachment: TAttachmentWithUrl) => {
    if (!transaction) return;
    setDeletingIds(prev => new Set(prev).add(attachment.id));
    const [_, error] = await apiClient.backend.transaction.deleteTransactionAttachments(transaction.id, {
      attachmentIds: [attachment.id],
    });
    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(attachment.id);
      return next;
    });
    if (error) {
      showSnackbar({message: `Failed to delete attachment: ${error.message}`});
      return;
    }
    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    showSnackbar({message: 'Attachment deleted successfully'});
  };

  return (
    <Drawer open={open} onClose={() => onClose()} closeOnBackdropClick closeOnEscape>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{p: 2, flexShrink: 0}}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1}>
              <AttachFileRounded color="action" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Attachments
                </Typography>
                {transaction && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {transaction.receiver}
                  </Typography>
                )}
              </Box>
            </Stack>
            <CloseIconButton onClick={onClose} />
          </Stack>
        </Box>

        <Divider />

        {/* Content */}
        <Box sx={{flexGrow: 1, overflowY: 'auto', p: 2}}>
          <Stack gap={2}>
            <AttachmentUploader onUpload={handleUpload} isUploading={isUploading} />
            <AttachmentList
              attachments={attachments}
              isLoading={isLoading}
              error={fetchError}
              onDelete={handleDelete}
              deletingIds={deletingIds}
              emptyMessage="No attachments for this transaction"
            />
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};
