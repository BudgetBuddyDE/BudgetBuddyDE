"use client";

import { AddRounded } from "@mui/icons-material";
import { Box, Button, IconButton, InputAdornment, Stack } from "@mui/material";
import React from "react";
import { ActionPaper } from "@/components/ActionPaper";
import { Card } from "@/components/Card";
import {
	EntityDrawer,
	type EntityDrawerField,
	type EntityDrawerFormHandler,
	entityDrawerReducer,
	type FirstLevelNullable,
	getInitialEntityDrawerState,
} from "@/components/Drawer";
import { ErrorAlert as ErrorComp } from "@/components/ErrorAlert";
import { CircularProgress } from "@/components/Loading";
import { NoResults } from "@/components/NoResults";
import { useSnackbarContext } from "@/components/Snackbar";
import { Pagination } from "@/components/Table/EntityTable/Pagination";
import { budgetSlice } from "@/lib/features/budgets/budgetSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logger } from "@/logger";
import { BudgetService } from "@/services/Budget.service";
import { CategoryService } from "@/services/Category.service";
import { CreateOrUpdateBudget, type TBudget, type TCategory_VH } from "@/types";
import { type Budget, BudgetItem, type BudgetItemProps } from "./BudgetItem";

type EntityFormFields = FirstLevelNullable<
	Pick<TBudget, "ID" | "type" | "name" | "budget"> & {
		toCategories: TCategory_VH[];
	}
>;

export type BudgetListProps = undefined;

export const BudgetList: React.FC<BudgetListProps> = () => {
	const { showSnackbar } = useSnackbarContext();
	const { refresh, getPage, setPage, setRowsPerPage } = budgetSlice.actions;
	const dispatch = useAppDispatch();
	const {
		status,
		error,
		currentPage,
		rowsPerPage,
		count: totalEntityCount,
		data: budgets,
	} = useAppSelector(budgetSlice.selectors.getState);
	const [drawerState, dispatchDrawerAction] = React.useReducer(
		entityDrawerReducer,
		getInitialEntityDrawerState<EntityFormFields>(),
	);

	const handleCreateEntity = () => {
		dispatchDrawerAction({
			type: "OPEN",
			action: "CREATE",
			defaultValues: {
				ID: null,
				type: "i",
				name: null,
				budget: null,
				toCategories: [],
			},
		});
	};

	const handleEditEntity = ({ ID, type, name, budget, categories }: Budget) => {
		const _now = new Date();
		dispatchDrawerAction({
			type: "OPEN",
			action: "EDIT",
			defaultValues: {
				ID,
				type,
				name,
				budget,
				toCategories: categories,
			},
		});
	};

	const handleDeleteEntity = async (entity: Budget) => {
		const [success, error] = await BudgetService.delete(entity.ID);
		if (error || !success) {
			return showSnackbar({
				message: error.message,
				action: (
					<Button onClick={() => handleDeleteEntity(entity)}>Retry</Button>
				),
			});
		}

		showSnackbar({ message: `Budget '${entity.name}' deleted successfully` });
		dispatch(refresh());
	};

	const handleClickEntity: BudgetItemProps["onClickBudget"] = () => {};

	const closeEntityDrawer = () => {
		dispatchDrawerAction({ type: "CLOSE" });
	};

	const handleFormSubmission: EntityDrawerFormHandler<
		EntityFormFields
	> = async (payload, onSuccess) => {
		const action = drawerState.action;

		const parsedPayload = CreateOrUpdateBudget.pick({
			type: true,
			name: true,
			budget: true,
			toCategories: true,
		}).safeParse({
			...payload,
			budget: Number(payload.budget),
			toCategories: payload.toCategories?.map((category) => ({
				toCategory_ID: category.ID,
			})),
		});
		if (!parsedPayload.success) {
			const issues: string = parsedPayload.error.issues
				.map((issue) => issue.message)
				.join(", ");
			showSnackbar({
				message: `Failed to ${action === "CREATE" ? "create" : "update"} budget: ${issues}`,
				action: (
					<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
						Retry
					</Button>
				),
			});
			return;
		}

		if (action === "CREATE") {
			const [_, error] = await BudgetService.create(parsedPayload.data);
			if (error) {
				return showSnackbar({
					message: `Failed to create budget: ${error.message}`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			showSnackbar({
				message: `Budget '${parsedPayload.data.name}' created successfully`,
			});
			dispatchDrawerAction({ type: "CLOSE" });
			onSuccess?.();
			dispatch(refresh());
		} else if (action === "EDIT") {
			const entityId = drawerState.defaultValues?.ID;
			if (!entityId) {
				return showSnackbar({
					message: `Failed to update budget: Missing entity ID`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}

			const [_, error] = await BudgetService.update(
				entityId,
				parsedPayload.data,
			);
			if (error) {
				return showSnackbar({
					message: `Failed to create budget: ${error.message}`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			showSnackbar({
				message: `Budget '${parsedPayload.data.name}' created successfully`,
			});
			dispatchDrawerAction({ type: "CLOSE" });
			onSuccess?.();
			dispatch(refresh());
		}
	};

	const dispatchNewPage = React.useCallback(
		(newPage: number) => {
			dispatch(setPage(newPage));
		},
		[dispatch, setPage],
	);

	const dispatchNewRowsPerPage = React.useCallback(
		(newRowsPerPage: number) => {
			// TODO: Implement validation, in order to ensure that only an valid option is passed
			dispatch(setRowsPerPage(newRowsPerPage));
		},
		[dispatch, setRowsPerPage],
	);

	const EntityFormFields: EntityDrawerField<EntityFormFields>[] =
		React.useMemo(() => {
			return [
				{
					type: "select",
					name: "type",
					required: true,
					exclusive: true,
					options: [
						{
							label: "Include",
							value: "i",
							description: "Include these categories in the budget",
							descriptionPlacement: "bottom",
						},
						{
							label: "Exclude",
							value: "e",
							description: "Exclude these categories from the budget",
							descriptionPlacement: "bottom",
						},
					],
				},
				{
					type: "text",
					name: "name",
					required: true,
					label: "Name",
					placeholder: "e.g. Groceries, Rent, ...",
				},
				{
					type: "number",
					name: "budget",
					required: true,
					label: "Budget Amount",
					placeholder: "e.g. 500.00",
					slotProps: {
						input: {
							endAdornment: (
								<InputAdornment position="end">&euro;</InputAdornment>
							),
						},
					},
				},
				{
					type: "autocomplete",
					name: "toCategories",
					label: "Categories",
					placeholder: "Select categories",
					required: true,
					retrieveOptionsFunc: async () => {
						const [categories, error] = await CategoryService.getCategoryVH();
						if (error) {
							logger.error("Failed to fetch category options:", error);
							return [];
						}
						return categories ?? [];
					},
					getOptionLabel: (option: TCategory_VH) => {
						return option.name;
					},
					isOptionEqualToValue(option: TCategory_VH, value: TCategory_VH) {
						return option.ID === value.ID;
					},
					multiple: true,
					disableCloseOnSelect: true,
					noOptionsText: "No categories found",
				},
			] as EntityDrawerField<EntityFormFields>[];
		}, []);

	// Retrieve new data, every time the page is changed
	React.useEffect(() => {
		dispatch(
			getPage({
				page: currentPage,
				rowsPerPage: rowsPerPage,
			}),
		);
	}, [dispatch, getPage, currentPage, rowsPerPage]);

	return (
		<React.Fragment>
			<Card>
				<Card.Header sx={{ mb: 1 }}>
					<Box>
						<Card.Title>Budget</Card.Title>
						<Card.Subtitle>Keep your spendings on track</Card.Subtitle>
					</Box>

					<Card.HeaderActions>
						<IconButton color="primary" onClick={handleCreateEntity}>
							<AddRounded />
						</IconButton>
					</Card.HeaderActions>
				</Card.Header>
				<Card.Body>
					<ErrorComp
						error={error}
						sx={{ my: 1, mb: budgets && budgets.length > 0 ? 1 : 0 }}
					/>
					{status === "loading" ? (
						<CircularProgress />
					) : budgets && budgets.length > 0 ? (
						<Stack rowGap={1}>
							{budgets.map(
								({ ID, name, budget, toCategories, type, balance }) => {
									return (
										<BudgetItem
											key={ID}
											budget={{
												ID,
												name,
												type,
												budget,
												categories: toCategories.map(
													({ toCategory: { ID, name, description } }) => ({
														ID,
														name,
														description,
													}),
												),
												balance,
											}}
											onEditBudget={handleEditEntity}
											onDeleteBudget={handleDeleteEntity}
											onClickBudget={handleClickEntity}
										/>
									);
								},
							)}
						</Stack>
					) : (
						<NoResults
							text={"You haven't created any budgets yet! Create one..."}
						/>
					)}
				</Card.Body>
				<Card.Footer>
					<ActionPaper sx={{ width: "fit-content", ml: "auto", mt: 2 }}>
						<Pagination
							count={totalEntityCount}
							page={currentPage}
							rowsPerPage={rowsPerPage}
							onChangePage={dispatchNewPage}
							onChangeRowsPerPage={dispatchNewRowsPerPage}
						/>
					</ActionPaper>
				</Card.Footer>
			</Card>

			<EntityDrawer<EntityFormFields>
				title={"Budget"}
				subtitle={
					drawerState.action === "CREATE"
						? "Create new budget"
						: "Edit an budget"
				}
				open={drawerState.isOpen}
				onSubmit={handleFormSubmission}
				onClose={closeEntityDrawer}
				closeOnBackdropClick
				onResetForm={() => {
					return {
						ID: null,
						type: "i",
						name: null,
						budget: null,
						toCategories: [],
					};
				}}
				defaultValues={drawerState.defaultValues ?? undefined}
				fields={EntityFormFields}
			/>
		</React.Fragment>
	);
};
