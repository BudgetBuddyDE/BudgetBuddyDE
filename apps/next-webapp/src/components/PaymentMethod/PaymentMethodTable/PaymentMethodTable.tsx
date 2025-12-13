"use client";

import { Button, TableCell, TableRow, Typography } from "@mui/material";
import React from "react";
import {
	EntityDrawer,
	type EntityDrawerFormHandler,
	entityDrawerReducer,
	type FirstLevelNullable,
	getInitialEntityDrawerState,
} from "@/components/Drawer";
import { useSnackbarContext } from "@/components/Snackbar";
import { EntityMenu, EntityTable } from "@/components/Table/EntityTable";
import { paymentMethodSlice } from "@/lib/features/paymentMethods/paymentMethodSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logger } from "@/logger";
import { NewPaymentMethodService } from "@/services/PaymentMethod.service";
import { CreateOrUpdatePaymentMethod, type TPaymentMethod } from "@/types";

type EntityFormFields = FirstLevelNullable<
	Pick<TPaymentMethod, "id" | "name" | "address" | "provider" | "description">
>;

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type PaymentMethodTableProps = {};

export const PaymentMethodTable: React.FC<PaymentMethodTableProps> = () => {
	const { showSnackbar } = useSnackbarContext();
	const { refresh, getPage, setPage, setRowsPerPage, applyFilters } =
		paymentMethodSlice.actions;
	const dispatch = useAppDispatch();
	const {
		status,
		error,
		currentPage,
		rowsPerPage,
		count: totalEntityCount,
		data: paymentMethods,
		filter: filters,
	} = useAppSelector(paymentMethodSlice.selectors.getState);
	const [drawerState, dispatchDrawerAction] = React.useReducer(
		entityDrawerReducer,
		getInitialEntityDrawerState<EntityFormFields>(),
	);

	const closeEntityDrawer = () => {
		dispatchDrawerAction({ type: "CLOSE" });
	};

	const handleCreateEntity = () => {
		dispatchDrawerAction({ type: "OPEN", action: "CREATE" });
	};

	const handleFormSubmission: EntityDrawerFormHandler<
		EntityFormFields
	> = async (payload, onSuccess) => {
		const action = drawerState.action;

		const parsedPayload = CreateOrUpdatePaymentMethod.safeParse(payload);
		if (!parsedPayload.success) {
			const issues: string = parsedPayload.error.issues
				.map((issue) => issue.message)
				.join(", ");
			showSnackbar({
				message: `Failed to ${action === "CREATE" ? "create" : "update"} payment method: ${issues}`,
				action: (
					<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
						Retry
					</Button>
				),
			});
			return;
		}

		if (action === "CREATE") {
			const [createdPaymentMethod, error] =
				await new NewPaymentMethodService().create(parsedPayload.data);
			if (!createdPaymentMethod || error) {
				return showSnackbar({
					message: `Failed to create payment method: ${error.message}`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			showSnackbar({
				message: createdPaymentMethod.message || "Payment Method created",
			});
			dispatchDrawerAction({ type: "CLOSE" });
			onSuccess?.();
			dispatch(refresh());
		} else if (action === "EDIT") {
			const entityId = drawerState.defaultValues?.id;
			if (!entityId) {
				return showSnackbar({
					message: `Failed to update payment method: Missing entity ID`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			const [updatedPaymentMethod, error] =
				await new NewPaymentMethodService().updateById(
					entityId,
					parsedPayload.data,
				);
			if (error) {
				return showSnackbar({
					message: `Failed to update payment method: ${error.message}`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			showSnackbar({
				message: updatedPaymentMethod.message || "Payment Method updated",
			});
			dispatchDrawerAction({ type: "CLOSE" });
			onSuccess?.();
			dispatch(refresh());
		}
	};

	const handleEditEntity = (entity: TPaymentMethod) => {
		dispatchDrawerAction({
			type: "OPEN",
			action: "EDIT",
			defaultValues: {
				id: entity.id,
				name: entity.name,
				address: entity.address,
				provider: entity.provider,
				description: entity.description,
			},
		});
	};

	const handleDeleteEntity = async (entity: TPaymentMethod) => {
		const [deletedPaymentMethod, error] =
			await new NewPaymentMethodService().deleteById(entity.id);
		if (error || !deletedPaymentMethod) {
			return showSnackbar({
				message: error.message,
				action: (
					<Button onClick={() => handleDeleteEntity(entity)}>Retry</Button>
				),
			});
		}

		showSnackbar({
			message:
				deletedPaymentMethod.message ??
				"Payment Method was deleted successfully",
		});
		dispatch(refresh());
	};

	const handleTextSearch = React.useCallback(
		(text: string) => {
			dispatch(
				applyFilters({
					keyword: text,
				}),
			);
		},
		[applyFilters, dispatch],
	);

	const dispatchNewPage = React.useCallback(
		(newPage: number) => {
			if (newPage < 0) {
				logger.warn("Tried to set page to a negative number, ignoring!");
				return;
			}

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
			<EntityTable<TPaymentMethod>
				title="Payment Methods"
				subtitle="Manage your payment methods"
				error={error}
				slots={{
					title: { showCount: true },
					noResults: {
						text: filters.keyword
							? `No payment methods found for "${filters.keyword}"`
							: "No payment methods found",
					},
					search: {
						enabled: true,
						placeholder: "Search payment methods…",
						onSearch: handleTextSearch,
					},
					create: { enabled: true, onClick: handleCreateEntity },
				}}
				totalEntityCount={totalEntityCount}
				isLoading={status === "loading"}
				data={paymentMethods??[]}
				dataKey={"id"}
				pagination={{
					count: totalEntityCount,
					page: currentPage,
					rowsPerPage: rowsPerPage,
					onChangePage(newPage) {
						return dispatchNewPage(newPage);
					},
					onChangeRowsPerPage(newRowsPerPage) {
						return dispatchNewRowsPerPage(newRowsPerPage);
					},
				}}
				headerCells={[
					{ key: "name", label: "Name" },
					{ key: "address", label: "Address" },
					{ key: "provider", label: "Provider" },
					{ key: "description", label: "Description" },
					{ placeholder: true },
				]}
				renderRow={(cell, item, _data) => {
					const key = cell;
					const rowKey = String(item[key]);
					return (
						<TableRow key={rowKey}>
							<TableCell>
								<Typography variant="body1">{item.name}</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body1">{item.address}</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body1">{item.provider}</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body1">
									{item.description || "No description"}
								</Typography>
							</TableCell>
							<TableCell align="right">
								<EntityMenu
									entity={item}
									handleEditEntity={handleEditEntity}
									handleDeleteEntity={handleDeleteEntity}
								/>
							</TableCell>
						</TableRow>
					);
				}}
			/>

			<EntityDrawer<EntityFormFields>
				title={"Payment Method"}
				subtitle={
					drawerState.action === "CREATE"
						? "Create new payment method"
						: "Edit payment method"
				}
				open={drawerState.isOpen}
				onSubmit={handleFormSubmission}
				onClose={closeEntityDrawer}
				closeOnBackdropClick
				onResetForm={() => {
					return {
						ID: null,
						name: null,
						address: null,
						provider: null,
						description: null,
					};
				}}
				defaultValues={drawerState.defaultValues ?? undefined}
				fields={[
					{
						type: "text",
						name: "name",
						label: "Name",
						placeholder: "Name",
						required: true,
					},
					{
						type: "text",
						name: "address",
						label: "Address",
						placeholder: "Address",
						required: true,
					},
					{
						type: "text",
						name: "provider",
						label: "Provider",
						placeholder: "Provider",
						required: true,
					},
					{
						type: "text",
						name: "description",
						label: "Description",
						placeholder: "Description",
						area: true,
						rows: 2,
					},
				]}
			/>
		</React.Fragment>
	);
};
