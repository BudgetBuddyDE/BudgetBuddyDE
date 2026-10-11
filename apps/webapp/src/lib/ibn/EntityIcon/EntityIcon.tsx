import {
  SwapHorizRounded,
  AttachFileRounded,
  KeyRounded,
  LabelRounded,
  PaymentsRounded,
  RepeatRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import type {SvgIconProps} from '@mui/material/SvgIcon';
import type React from 'react';
import type {IntentEntity} from '../types';

type EntityIconComponent = React.ComponentType<SvgIconProps>;

/** The single source of truth for entity icons across navigation and commands. */
export const ENTITY_ICONS: Record<IntentEntity, EntityIconComponent> = {
  transaction: SwapHorizRounded,
  recurringPayment: RepeatRounded,
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
