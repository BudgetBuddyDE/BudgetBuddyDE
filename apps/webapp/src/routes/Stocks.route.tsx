import {Feature} from '@/app.config';
import {withFeatureFlag} from '@/components/Feature';
import {ContentGrid} from '@/components/Layout';
import {withAuthLayout} from '@/features/Auth';

import {StocksView} from './Dashboard';

export const Stocks = () => {
  return (
    <ContentGrid title="Stocks" description={'Manage your positions'}>
      <StocksView />
    </ContentGrid>
  );
};

export default withFeatureFlag(Feature.STOCKS, withAuthLayout(Stocks), true);
