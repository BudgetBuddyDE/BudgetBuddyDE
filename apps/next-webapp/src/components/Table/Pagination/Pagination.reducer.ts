export type PaginationState = {
	page: number;
	rowsPerPage: number;
};

export type PaginationAction =
	| { type: "CHANGE_PAGE"; page: number }
	| { type: "NEXT_PAGE" | "PREVIOUS_PAGE" }
	| { type: "CHANGE_ROWS_PER_PAGE"; rowsPerPage: number };

export function PaginationReducer(
	state: PaginationState,
	action: PaginationAction,
) {
	switch (action.type) {
		case "CHANGE_PAGE":
			return {
				...state,
				page: action.page,
			};

		case "NEXT_PAGE":
			return {
				...state,
				page: state.page++,
			};

		case "PREVIOUS_PAGE":
			return {
				...state,
				page: state.page--,
			};

		case "CHANGE_ROWS_PER_PAGE":
			return {
				...state,
				rowsPerPage: action.rowsPerPage,
				page: 0,
			};

		default:
			throw new Error("Trying to execute unknown action");
	}
}
