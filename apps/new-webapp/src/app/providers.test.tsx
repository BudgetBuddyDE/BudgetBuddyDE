import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useTheme} from '@/theme/theme-provider';
import {AppProviders} from './providers';

function ProviderConsumer() {
  const {mode} = useTheme();
  return <span>Mode: {mode}</span>;
}

describe('AppProviders', () => {
  it('composes the application contexts around children', () => {
    render(
      <AppProviders>
        <ProviderConsumer />
      </AppProviders>,
    );
    expect(screen.getByText('Mode: system')).toBeInTheDocument();
  });
});
