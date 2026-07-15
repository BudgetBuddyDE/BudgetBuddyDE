'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {ATTACHMENT_CONTENT_TYPES} from '@budgetbuddyde/api/attachment';
import type {TTransaction} from '@budgetbuddyde/api/transaction';
import React from 'react';
import {apiClient} from '@/apiClient';
import {useSnackbarContext} from '@/components/Snackbar';
import {transactionAttachmentsInitialState, transactionAttachmentsReducer} from './transactionAttachmentsReducer';

const ALLOWED_CONTENT_TYPES = new Set<string>(ATTACHMENT_CONTENT_TYPES);
const ATTACHMENT_PAGE_SIZE = 24;

/** Extensions that browsers may report as `application/octet-stream` but are valid image types. */
const OCTET_STREAM_ALLOWED_EXTENSIONS = new Set(['heic', 'heif']);

function isAllowedFileType(file: File): boolean {
  if (ALLOWED_CONTENT_TYPES.has(file.type)) return true;
  if (file.type === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return OCTET_STREAM_ALLOWED_EXTENSIONS.has(ext);
  }
  return false;
}

/**
 * Manages all state and async operations for a transaction's attachments.
 * Attachments are loaded page-by-page to avoid generating signed URLs and
 * rendering image cards for large attachment collections upfront.
 *
 * @param transactionId - The ID of the transaction whose attachments are managed.
 */
export function useTransactionAttachments(transactionId: TTransaction['id']) {
  const {showSnackbar} = useSnackbarContext();
  const [state, dispatch] = React.useReducer(transactionAttachmentsReducer, transactionAttachmentsInitialState);

  const fetchAttachments = React.useCallback(
    async (from = 0, append = false) => {
      dispatch({type: append ? 'LOAD_MORE_START' : 'LOAD_START'});
      const [result, error] = await apiClient.backend.transaction.getTransactionAttachments(transactionId, {
        from,
        to: from + ATTACHMENT_PAGE_SIZE,
      });
      if (error) {
        dispatch({type: 'LOAD_ERROR'});
        showSnackbar({message: `Failed to load attachments: ${error.message}`});
        return;
      }
      dispatch({
        type: 'LOAD_SUCCESS',
        attachments: result.data ?? [],
        totalCount: result.totalCount ?? result.data?.length ?? 0,
        append,
      });
    },
    [transactionId, showSnackbar],
  );

  React.useEffect(() => {
    void fetchAttachments(0, false);
  }, [fetchAttachments]);

  const handleLoadMore = React.useCallback(() => {
    if (state.isLoading || state.isLoadingMore || state.attachments.length >= state.totalCount) return;
    void fetchAttachments(state.attachments.length, true);
  }, [fetchAttachments, state.attachments.length, state.isLoading, state.isLoadingMore, state.totalCount]);

  const handleUpload = React.useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const invalidFiles = files.filter(f => !isAllowedFileType(f));
      if (invalidFiles.length > 0) {
        const names = invalidFiles.map(f => f.name).join(', ');
        showSnackbar({message: `Unsupported file type(s): ${names}. Allowed types: PNG, JPG, WebP, HEIC.`});
        return;
      }

      dispatch({type: 'UPLOAD_START'});
      const [result, error] = await apiClient.backend.transaction.uploadTransactionAttachments(transactionId, files);
      if (error) {
        dispatch({type: 'UPLOAD_ERROR'});
        showSnackbar({message: `Upload failed: ${error.message}`});
        return;
      }
      dispatch({type: 'UPLOAD_SUCCESS', newAttachments: result.data ?? []});
      showSnackbar({message: `${result.data?.length ?? 0} file(s) uploaded successfully`});
    },
    [transactionId, showSnackbar],
  );

  const handleDownload = React.useCallback((attachment: TAttachmentWithUrl) => {
    const anchor = document.createElement('a');
    anchor.href = attachment.signedUrl;
    anchor.download = attachment.fileName;
    anchor.rel = 'noopener noreferrer';
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    const id = state.deletingAttachmentId;
    if (!id) return;
    dispatch({type: 'DELETE_CLOSE'});
    const [, error] = await apiClient.backend.transaction.deleteTransactionAttachments(transactionId, {
      attachmentIds: [id],
    });
    if (error) {
      showSnackbar({message: `Delete failed: ${error.message}`});
      return;
    }
    dispatch({type: 'DELETE_SUCCESS', attachmentId: id});
    showSnackbar({message: 'Attachment deleted'});
  }, [state.deletingAttachmentId, transactionId, showSnackbar]);

  return {state, dispatch, handleUpload, handleDownload, handleDeleteConfirm, handleLoadMore};
}
