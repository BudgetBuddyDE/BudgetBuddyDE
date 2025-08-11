'use client';

import { useState } from 'react';

import {
  decrement,
  increment,
  incrementAsync,
  incrementByAmount,
  incrementIfOdd,
  selectCount,
  selectStatus,
} from '@/lib/features/counter/counterSlice';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';

export const Counter = () => {
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectCount);
  const status = useAppSelector(selectStatus);
  const [incrementAmount, setIncrementAmount] = useState('2');

  const incrementValue = Number(incrementAmount) || 0;

  return (
    <div>
      <div>
        <button aria-label="Decrement value" onClick={() => dispatch(decrement())}>
          -
        </button>
        <span aria-label="Count">{count}</span>
        <button aria-label="Increment value" onClick={() => dispatch(increment())}>
          +
        </button>
      </div>
      <div>
        <input
          aria-label="Set increment amount"
          value={incrementAmount}
          type="number"
          onChange={(e) => {
            setIncrementAmount(e.target.value);
          }}
        />
        <button onClick={() => dispatch(incrementByAmount(incrementValue))}>Add Amount</button>
        <button
          disabled={status !== 'idle'}
          onClick={() => dispatch(incrementAsync(incrementValue))}
        >
          Add Async
        </button>
        <button
          onClick={() => {
            dispatch(incrementIfOdd(incrementValue));
          }}
        >
          Add If Odd
        </button>
      </div>
    </div>
  );
};
