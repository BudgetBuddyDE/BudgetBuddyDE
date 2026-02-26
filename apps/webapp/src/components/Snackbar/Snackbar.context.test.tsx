import {act, renderHook} from '@testing-library/react';
import React from 'react';
import {describe, expect, it} from 'vitest';

import {SnackbarContext, SnackbarProvider, useSnackbarContext} from './Snackbar';

const wrapper = ({children}: {children: React.ReactNode}) => <SnackbarProvider>{children}</SnackbarProvider>;

describe('useSnackbarContext', () => {
  it('provides a showSnackbar function', () => {
    const {result} = renderHook(() => useSnackbarContext(), {wrapper});
    expect(typeof result.current.showSnackbar).toBe('function');
  });

  it('calling showSnackbar does not throw', () => {
    const {result} = renderHook(() => useSnackbarContext(), {wrapper});
    expect(() => {
      act(() => {
        result.current.showSnackbar({message: 'Test message'});
      });
    }).not.toThrow();
  });
});

describe('SnackbarContext', () => {
  it('has a default empty context value', () => {
    const {result} = renderHook(() => React.useContext(SnackbarContext));
    expect(result.current).toBeDefined();
  });
});
