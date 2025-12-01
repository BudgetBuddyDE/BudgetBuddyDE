import type { ServiceResponse } from "@budgetbuddyde/types/";
import type { PayloadAction } from "@reduxjs/toolkit";
import { ITEMS_IN_VIEW } from "@/components/Table/EntityTable";
import { createAppSlice } from "@/lib/createAppSlice";
import type { RootState } from "@/lib/store";
import { logger } from "@/logger";
import type { BaseGetAllQuery } from "@/services/Entity.service";
import type { TApiResponse } from "@/types";

export type EntityFilters = {
	keyword: string | null;
};

export type EntitySliceState<T> = {
	count: number;
	data: T[];
	filter: EntityFilters;
	currentPage: number;
	rowsPerPage: number;
	status: "idle" | "loading" | "failed";
	error: Error | null;
};

export function createInitialState<T>(initalData?: T[]): EntitySliceState<T> {
	return {
		count: 0,
		data: initalData || [],
		filter: { keyword: null },
		currentPage: 0,
		rowsPerPage: ITEMS_IN_VIEW,
		status: "idle",
		error: null,
	};
}

type ResponseBody<T> = TApiResponse<T>;

export function createEntitySlice<T, Q extends BaseGetAllQuery>(
	name: string,
	getPageFunc: (query?: Q) => Promise<ServiceResponse<ResponseBody<T>>>,
) {
	const initialState = createInitialState<T>();
	const entitySlice = createAppSlice({
		name,
		initialState,
		reducers: (create) => ({
			refresh: create.asyncThunk(
				async (_, api) => {
					// REVISIT: Check if I can solve this logic more elegant
					// Get cached filters
					const thunkState = api.getState() as RootState;
					const sliceState = thunkState[name];
					const currentFilters = sliceState.filter;
					const currentPage = sliceState.currentPage;
					const rowsPerPage = sliceState.rowsPerPage;
					const start = currentPage * rowsPerPage;
					const query = {
						from: start,
						to: start + rowsPerPage,
					} as Q;
					if (currentFilters.keyword && currentFilters.keyword.length > 0) {
						query.search = currentFilters.keyword;
					}
					const [data, err] = await Promise.resolve(getPageFunc(query));
					if (err) throw err;
					// The value we return becomes the `fulfilled` action payload
					return data;
				},
				{
					pending: (state) => {
						state.status = "loading";
					},
					fulfilled: (state, action) => {
						state.status = "idle";
						// @ts-expect-error
						state.data = action.payload.data;
						state.count = action.payload.totalCount || 0;
					},
					rejected: (state, { error }) => {
						state.status = "failed";
						// @ts-expect-error
						state.error = error;
					},
				},
			),
			getPage: create.asyncThunk(
				async (
					{
						page,
						rowsPerPage,
						query: q,
					}: {
						page: number;
						rowsPerPage: number;
						query?: Q;
					},
					api,
				) => {
					if (page < 0) {
						logger.warn(`Requested page ${page} is invalid, resetting to 0`);
						page = 0;
					}

					// Get cached filters
					const thunkState = api.getState() as RootState;
					const sliceState = thunkState[name];
					const currentFilters = sliceState.filter;
					const start = page * rowsPerPage;
					const query = {
						from: start,
						to: start + rowsPerPage,
						...q,
					} as Q;
					if (currentFilters.keyword && currentFilters.keyword.length > 0) {
						query.search = currentFilters.keyword;
					}
					const [data, err] = await Promise.resolve(getPageFunc(query));
					if (err) throw err;
					// The value we return becomes the `fulfilled` action payload
					return data;
				},
				{
					pending: (state) => {
						state.status = "loading";
					},
					fulfilled: (state, action) => {
						state.status = "idle";
						state.currentPage = action.meta.arg?.page;
						state.rowsPerPage = action.meta.arg?.rowsPerPage;
						// @ts-expect-error
						state.data = action.payload.data;
						state.count = action.payload.totalCount || 0;
					},
					rejected: (state, { error }) => {
						state.status = "failed";
						// @ts-expect-error
						state.error = error;
					},
				},
			),
			applyFilters: create.asyncThunk(
				async (filters: Partial<EntityFilters>, api) => {
					const state = api.getState() as RootState;
					const currentSliceState = state[name] as EntitySliceState<T>;
					const query = {
						from: 0,
						to: currentSliceState.rowsPerPage,
					} as Q;
					if (filters.keyword && filters.keyword.length > 0) {
						query.search = filters.keyword;
					}
					const [data, err] = await Promise.resolve(getPageFunc(query));
					if (err) throw err;
					return { data: data, filters: filters };
				},
				{
					pending: (state) => {
						state.status = "loading";
					},
					fulfilled: (state, action) => {
						state.status = "idle";
						state.currentPage = 0; // Reset to first page, because we have a new set of data
						// Merge current filters with new applied filters
						state.filter = { ...state.filter, ...action.payload.filters };
						const data = action.payload.data;
						// @ts-expect-error
						state.data = data.data;
						state.count = data.totalCount || 0;
					},
					rejected: (state) => {
						state.status = "failed";
						// @ts-expect-error
						state.error = error;
					},
				},
			),
			setPage: create.reducer((state, action: PayloadAction<number>) => {
				state.currentPage = action.payload;
			}),
			setRowsPerPage: create.reducer((state, action: PayloadAction<number>) => {
				state.rowsPerPage = action.payload;
			}),
		}),
		selectors: {
			getState: (state) => {
				return state;
			},
			getTotalEntityCount: (state) => {
				return state.count;
			},
			getStatus: (state) => {
				return {
					status: state.status,
					error: state.error,
				};
			},
			getData: (state) => state.data,
			getPagination: (state) => {
				return {
					currentPage: state.currentPage,
					rowsPerPage: state.rowsPerPage,
				};
			},
			getFilter: (state) => {
				return state.filter;
			},
		},
	});

	return entitySlice;
}
