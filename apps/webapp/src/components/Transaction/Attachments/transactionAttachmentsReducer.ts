import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';

/** Represents the complete UI and data state for the transaction attachments feature. */
export type TransactionAttachmentsState = {
  attachments: TAttachmentWithUrl[];
  isLoading: boolean;
  isUploading: boolean;
  isDragging: boolean;
  viewedAttachment: TAttachmentWithUrl | null;
  deletingAttachmentId: TAttachmentWithUrl['id'] | null;
};

/** Union of all actions that can be dispatched to update {@link TransactionAttachmentsState}. */
export type TransactionAttachmentsAction =
  | {type: 'LOAD_START'}
  | {type: 'LOAD_SUCCESS'; attachments: TAttachmentWithUrl[]}
  | {type: 'LOAD_ERROR'}
  | {type: 'UPLOAD_START'}
  | {type: 'UPLOAD_SUCCESS'; newAttachments: TAttachmentWithUrl[]}
  | {type: 'UPLOAD_ERROR'}
  | {type: 'SET_DRAGGING'; dragging: boolean}
  | {type: 'VIEW_OPEN'; attachment: TAttachmentWithUrl}
  | {type: 'VIEW_CLOSE'}
  | {type: 'DELETE_OPEN'; attachmentId: TAttachmentWithUrl['id']}
  | {type: 'DELETE_CLOSE'}
  | {type: 'DELETE_SUCCESS'; attachmentId: TAttachmentWithUrl['id']};

/** Initial state used when the hook is first mounted. */
export const transactionAttachmentsInitialState: TransactionAttachmentsState = {
  attachments: [],
  isLoading: true,
  isUploading: false,
  isDragging: false,
  viewedAttachment: null,
  deletingAttachmentId: null,
};

/**
 * Pure reducer that computes the next {@link TransactionAttachmentsState} for a given action.
 * Designed to be used with `React.useReducer` inside {@link useTransactionAttachments}.
 */
export function transactionAttachmentsReducer(
  state: TransactionAttachmentsState,
  action: TransactionAttachmentsAction,
): TransactionAttachmentsState {
  switch (action.type) {
    case 'LOAD_START':
      return {...state, isLoading: true};
    case 'LOAD_SUCCESS':
      return {...state, isLoading: false, attachments: action.attachments};
    case 'LOAD_ERROR':
      return {...state, isLoading: false};
    case 'UPLOAD_START':
      return {...state, isUploading: true};
    case 'UPLOAD_SUCCESS':
      return {...state, isUploading: false, attachments: [...state.attachments, ...action.newAttachments]};
    case 'UPLOAD_ERROR':
      return {...state, isUploading: false};
    case 'SET_DRAGGING':
      return {...state, isDragging: action.dragging};
    case 'VIEW_OPEN':
      return {...state, viewedAttachment: action.attachment};
    case 'VIEW_CLOSE':
      return {...state, viewedAttachment: null};
    case 'DELETE_OPEN':
      return {...state, deletingAttachmentId: action.attachmentId};
    case 'DELETE_CLOSE':
      return {...state, deletingAttachmentId: null};
    case 'DELETE_SUCCESS':
      return {
        ...state,
        deletingAttachmentId: null,
        attachments: state.attachments.filter(a => a.id !== action.attachmentId),
      };
    default:
      return state;
  }
}
