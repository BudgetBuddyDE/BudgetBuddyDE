import React from 'react';
import {useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {type TFullScreenDialogProps} from '@/components/Base/FullScreenDialog';
import {InsightsDialog} from '@/features/Insights';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';

export type TInsightsViewProps =
  | {navigateOnClose: true; navigateTo?: string}
  | ({navigateOnClose: false} & Pick<TFullScreenDialogProps, 'onClose'>);

const InsightsView: React.FC<TInsightsViewProps> = props => {
  useDocumentTitle(`${AppConfig.appName} - Insights`, true);
  const navigate = useNavigate();

  const handleClose = () => {
    if (props.navigateOnClose) {
      props.navigateTo ? navigate(props.navigateTo) : navigate(-1);
    } else props.onClose();
  };

  return <InsightsDialog open onClose={handleClose} />;
};

export default InsightsView;
