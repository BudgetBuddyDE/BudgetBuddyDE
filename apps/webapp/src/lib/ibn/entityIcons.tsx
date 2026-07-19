import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import KeyRounded from '@mui/icons-material/KeyRounded';
import LabelRounded from '@mui/icons-material/LabelRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import ReceiptRounded from '@mui/icons-material/ReceiptRounded';
import ScheduleSendRounded from '@mui/icons-material/ScheduleSendRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import type {SvgIconProps} from '@mui/material/SvgIcon';
import type React from 'react';
import type {IntentEntity} from './types';

type EntityIconComponent = React.ComponentType<SvgIconProps>;

/** The single source of truth for entity icons across navigation and commands. */
export const ENTITY_ICONS: Record<IntentEntity, EntityIconComponent> = {
  transaction: ReceiptRounded,
  recurringPayment: ScheduleSendRounded,
  paymentMethod: PaymentsRounded,
  category: LabelRounded,
  budget: TrendingUpRounded,
  attachment: AttachFileRounded,
  apiKey: KeyRounded,
};

export type EntityIconProps = SvgIconProps & {entity: IntentEntity};

export const EntityIcon: React.FC<EntityIconProps> = ({entity, ...props}) => {
  const Icon = ENTITY_ICONS[entity];
  return <Icon {...props} />;
};
