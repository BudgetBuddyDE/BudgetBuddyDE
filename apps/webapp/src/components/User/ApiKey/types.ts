import type {ApiKey} from '@better-auth/api-key';

export type {ApiKey};
export type ApiKeyFormFields = {
  name: string | null;
  expiresAt: Date | null;
};

export type CreatedKeyDialogState = {
  key: string | null;
  copied: boolean;
  acknowledged: boolean;
};

export const initialCreatedKeyDialogState: CreatedKeyDialogState = {
  key: null,
  copied: false,
  acknowledged: false,
};
