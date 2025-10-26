import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { budgetSlice } from "./features/budgets/budgetSlice";
import { categorySlice } from "./features/categories/categorySlice";
import { paymentMethodSlice } from "./features/paymentMethods/paymentMethodSlice";
import { stockExchangeSlice } from "./features/stocks/stockExchangeSlice";
import { stockPositionSlice } from "./features/stocks/stockPositionSlice";
import { subscriptionSlice } from "./features/subscriptions/subscriptionSlice";
import { transactionSlice } from "./features/transactions/transactionSlice";

// `combineSlices` automatically combines the reducers using
// their `reducerPath`s, therefore we no longer need to call `combineReducers`.
const rootReducer = combineSlices(
	categorySlice,
	paymentMethodSlice,
	transactionSlice,
	subscriptionSlice,
	budgetSlice,
	stockExchangeSlice,
	stockPositionSlice,
);
// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof rootReducer>;

// `makeStore` encapsulates the store configuration to allow
// creating unique store instances, which is particularly important for
// server-side rendering (SSR) scenarios. In SSR, separate store instances
// are needed for each request to prevent cross-request state pollution.
export const makeStore = () => {
	return configureStore({
		reducer: rootReducer,
		// Adding the api middleware enables caching, invalidation, polling,
		// and other useful features of `rtk-query`.
		middleware: (getDefaultMiddleware) => {
			return getDefaultMiddleware({
				// Look up this documentation for more information:
				// https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
				// ignoreActions: true,
				serializableCheck: {
					// REVISIT: Refine paths to only ignore createdAt|modifiedAt|nextExecution|processedAt
					/**
					 * Opt out of checking state. When set to `true`, other state-related params will be ignored.
					 */
					ignoreState: true,
					/**
					 * Opt out of checking actions. When set to `true`, other action-related params will be ignored.
					 */
					ignoreActions: true,
				},
			}); /*.concat(quotesApiSlice.middleware);*/
		},
	});
};

// Infer the return type of `makeStore`
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
	ThunkReturnType,
	RootState,
	unknown,
	Action
>;
