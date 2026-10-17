'use client';
import {setRequestCacheScope} from '@budgetbuddyde/api';
import {setupListeners} from '@reduxjs/toolkit/query';
import type {ReactNode} from 'react';
import {useEffect, useRef, useState} from 'react';
import {Provider} from 'react-redux';
import {authClient} from '@/authClient';
import {budgetSlice} from '@/lib/features/budgets/budgetSlice';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {paymentMethodSlice} from '@/lib/features/paymentMethods/paymentMethodSlice';
import {recurringPaymentSlice} from '@/lib/features/recurringPayments/recurringPaymentSlice';
import {transactionSlice} from '@/lib/features/transactions/transactionSlice';
import type {AppStore} from '@/lib/store';
import {makeStore} from '@/lib/store';

interface Props {
  readonly children: ReactNode;
}

export const StoreProvider = ({children}: Props) => {
  const storeRef = useRef<AppStore | null>(null);
  const appliedScopeRef = useRef<string | null | undefined>(undefined);
  const [appliedScope, setAppliedScope] = useState<string | null | undefined>(undefined);
  const {data: session, isPending} = authClient.useSession();

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  useEffect(() => {
    if (storeRef.current != null) {
      // configure listeners using the provided defaults
      // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
      const unsubscribe = setupListeners(storeRef.current.dispatch);
      return unsubscribe;
    }
  }, []);

  const nextScope = session?.user?.id && session.session?.id ? `${session.user.id}:${session.session.id}` : null;

  useEffect(() => {
    if (isPending || appliedScopeRef.current === nextScope) return;
    setRequestCacheScope(nextScope);
    storeRef.current?.dispatch(categorySlice.actions.reset());
    storeRef.current?.dispatch(paymentMethodSlice.actions.reset());
    storeRef.current?.dispatch(transactionSlice.actions.reset());
    storeRef.current?.dispatch(recurringPaymentSlice.actions.reset());
    storeRef.current?.dispatch(budgetSlice.actions.reset());
    appliedScopeRef.current = nextScope;
    setAppliedScope(nextScope);
  }, [isPending, nextScope]);

  if (isPending || appliedScope !== nextScope) return null;

  return <Provider store={storeRef.current}>{children}</Provider>;
};
