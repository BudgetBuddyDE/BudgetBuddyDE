"use client";

import {
	Button,
	Chip,
	createFilterOptions,
	InputAdornment,
	Stack,
	TableCell,
	TableRow,
	Typography,
} from "@mui/material";
import React from "react";
import { CategoryChip } from "@/components/Category/CategoryChip";
import {
	EntityDrawer,
	type EntityDrawerField,
	type EntityDrawerFormHandler,
	entityDrawerReducer,
	type FirstLevelNullable,
	getInitialEntityDrawerState,
} from "@/components/Drawer";
import { PaymentMethodChip } from "@/components/PaymentMethod/PaymentMethodChip";
import { useSnackbarContext } from "@/components/Snackbar";
import { EntityMenu, EntityTable } from "@/components/Table/EntityTable";
import { subscriptionSlice } from "@/lib/features/subscriptions/subscriptionSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logger } from "@/logger";
import { Backend } from "@/services/Backend";
import {
	CategoryVH,
	CdsDate,
	CreateOrUpdateRecurringPayment,
	PaymentMethodVH,
	ReceiverVH,
	type TCategoryVH,
	type TExpandedRecurringPayment,
	type TPaymentMethodVH,
	type TReceiverVH,
	type TRecurringPayment,
} from "@/types";
import { Formatter } from "@/utils/Formatter";

type EntityFormFields = FirstLevelNullable<
	Pick<
		TRecurringPayment,
		| "id"
		| /*'categoryId' | 'paymentMethodId' | 'receiver' |*/ "transferAmount"
		| "information"
	> & {
		// Because we're gonna use a Date Picker and Autocompletes for relations, we need to override those types
		executeAt: Date;
		category: TCategoryVH;
		paymentMethod: TPaymentMethodVH;
		receiver: TReceiverVH | ({ new: true; label: string } & TReceiverVH);
	}
>;

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type SubscriptionTableProps = {};

export const SubscriptionTable: React.FC<SubscriptionTableProps> = () => {
	const { showSnackbar } = useSnackbarContext();
	const { refresh, getPage, setPage, setRowsPerPage, applyFilters } =
		subscriptionSlice.actions;
	const dispatch = useAppDispatch();
	const {
		status,
		error,
		currentPage,
		rowsPerPage,
		count: totalEntityCount,
		data: subscriptions,
		filter: filters,
	} = useAppSelector(subscriptionSlice.selectors.getState);
	const [drawerState, dispatchDrawerAction] = React.useReducer(
		entityDrawerReducer,
		getInitialEntityDrawerState<EntityFormFields>(),
	);

	const closeEntityDrawer = () => {
		dispatchDrawerAction({ type: "CLOSE" });
	};

	const handleFormSubmission: EntityDrawerFormHandler<
		EntityFormFields
	> = async (payload, onSuccess) => {
		const action = drawerState.action;

		const parsedPayload = CreateOrUpdateRecurringPayment.omit({
			paused: true,
			executeAt: true,
			categoryId: true,
			paymentMethodId: true,
		})
			.extend({
				executeAt: CdsDate,
				category: CategoryVH,
				paymentMethod: PaymentMethodVH,
				receiver: ReceiverVH,
			})
			.safeParse({
				...payload,
				transferAmount: Number(payload.transferAmount),
			});
		console.log("parsedPayload", parsedPayload);
		console.log({
			...payload,
			transferAmount: Number(payload.transferAmount),
		});
		if (!parsedPayload.success) {
			const issues: string = parsedPayload.error.issues
				.map((issue) => issue.message)
				.join(", ");
			showSnackbar({
				message: `Failed to ${action === "CREATE" ? "create" : "update"} recurring payment: ${issues}`,
				action: (
					<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
						Retry
					</Button>
				),
			});
			return;
		}

		if (action === "CREATE") {
			const {
				executeAt,
				category,
				paymentMethod,
				receiver,
				information,
				transferAmount,
			} = parsedPayload.data;
			const [createdRecurringPayment, error] =
				await Backend.recurringPayment.create({
					executeAt: executeAt.getDate(),
					categoryId: category.id,
					paymentMethodId: paymentMethod.id,
					receiver: receiver.receiver,
					information:
						information && information.length > 0 ? information : null,
					transferAmount: transferAmount,
				});
			if (!createdRecurringPayment || error) {
				return showSnackbar({
					message: `Failed to create subscription: ${error.message}`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			showSnackbar({
				message:
					createdRecurringPayment.message ??
					"Subscription created successfully",
			});
			dispatchDrawerAction({ type: "CLOSE" });
			onSuccess?.();
			dispatch(refresh());
		} else if (action === "EDIT") {
			const entityId = drawerState.defaultValues?.id;
			if (!entityId) {
				return showSnackbar({
					message: `Failed to update subscription: Missing entity ID`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			const {
				executeAt,
				category,
				paymentMethod,
				receiver,
				information,
				transferAmount,
			} = parsedPayload.data;
			const [updatedRecurringPayment, error] =
				await Backend.recurringPayment.updateById(entityId, {
					executeAt: executeAt.getDate(),
					categoryId: category.id,
					paymentMethodId: paymentMethod.id,
					receiver: receiver.receiver,
					information:
						information && information.length > 0 ? information : null,
					transferAmount: transferAmount,
				});
			if (!updatedRecurringPayment || error) {
				return showSnackbar({
					message: `Failed to update subscription: ${error.message}`,
					action: (
						<Button onClick={() => handleFormSubmission(payload, onSuccess)}>
							Retry
						</Button>
					),
				});
			}
			showSnackbar({
				message:
					updatedRecurringPayment.message ??
					"Subscription updated successfully",
			});
			dispatchDrawerAction({ type: "CLOSE" });
			onSuccess?.();
			dispatch(refresh());
		}
	};

	const handleCreateEntity = () => {
		dispatchDrawerAction({
			type: "OPEN",
			action: "CREATE",
			defaultValues: {
				executeAt: new Date(),
			},
		});
	};

	const handleEditEntity = ({
		id,
		executeAt,
		receiver,
		category,
		paymentMethod,
		transferAmount,
		information,
	}: TExpandedRecurringPayment) => {
		const now = new Date();
		dispatchDrawerAction({
			type: "OPEN",
			action: "EDIT",
			defaultValues: {
				id,
				executeAt: new Date(now.getFullYear(), now.getMonth(), executeAt),
				receiver: { receiver: receiver },
				category: {
					id: category.id,
					name: category.name,
					description: category.description,
				},
				paymentMethod: {
					id: paymentMethod.id,
					name: paymentMethod.name,
					address: paymentMethod.address,
					provider: paymentMethod.provider,
					description: paymentMethod.description,
				},
				transferAmount,
				information,
			},
		});
	};

	const handleTogglePauseOnEntity = async (
		entity: TExpandedRecurringPayment,
	) => {
		const [updatedRecurringPayment, error] =
			await Backend.recurringPayment.updateById(entity.id, {
				paused: !entity.paused,
			});
		if (!updatedRecurringPayment || error) {
			return showSnackbar({
				message: `Failed to update subscription: ${error.message}`,
				action: (
					<Button onClick={() => handleTogglePauseOnEntity(entity)}>
						Retry
					</Button>
				),
			});
		}
		showSnackbar({
			message:
				updatedRecurringPayment.message ?? "Subscription updated successfully",
		});
		dispatchDrawerAction({ type: "CLOSE" });
		dispatch(refresh());
	};

	const handleDeleteEntity = async (entity: TExpandedRecurringPayment) => {
		const [deletedRecurringPayment, error] =
			await Backend.recurringPayment.deleteById(entity.id);
		if (!deletedRecurringPayment || error) {
			return showSnackbar({
				message: error.message,
				action: (
					<Button onClick={() => handleDeleteEntity(entity)}>Retry</Button>
				),
			});
		}

		showSnackbar({
			message:
				deletedRecurringPayment.message ?? "Subscription deleted successfully",
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

	const EntityFormFields: EntityDrawerField<EntityFormFields>[] =
		// @ts-expect-error REVISIT: Fix the typing
		React.useMemo(() => {
			return [
				{
					type: "date",
					name: "executeAt",
					label: "Execute at",
					placeholder: "Execute at",
					required: true,
				},
				{
					size: { xs: 12, md: 6 },
					type: "autocomplete",
					name: "category",
					label: "Category",
					placeholder: "Category",
					required: true,
					retrieveOptionsFunc: async () => {
						const [categories, error] = await Backend.category.getValueHelp();
						if (error) {
							logger.error("Failed to fetch receiver options:", error);
							return [];
						}
						return categories ?? [];
					},
					getOptionLabel: (option: TCategoryVH) => {
						return option.name;
					},
					isOptionEqualToValue(option: TCategoryVH, value: TCategoryVH) {
						return option.id === value.id;
					},
					noOptionsText: "No categories found",
				},
				{
					size: { xs: 12, md: 6 },
					type: "autocomplete",
					name: "paymentMethod",
					label: "Payment Method",
					placeholder: "Payment Method",
					required: true,
					retrieveOptionsFunc: async () => {
						const [paymentMethods, error] =
							await Backend.paymentMethod.getValueHelp();
						if (error) {
							logger.error("Failed to fetch payment method options:", error);
							return [];
						}
						return paymentMethods ?? [];
					},
					getOptionLabel: (option: TPaymentMethodVH) => {
						return option.name;
					},
					isOptionEqualToValue(
						option: TPaymentMethodVH,
						value: TPaymentMethodVH,
					) {
						return option.id === value.id;
					},
					noOptionsText: "No payment methods found",
				},
				{
					type: "autocomplete",
					name: "receiver",
					label: "Receiver",
					placeholder: "Receiver",
					required: true,
					retrieveOptionsFunc: async () => {
						const [categories, error] =
							await Backend.transaction.getReceiverVH();
						if (error) {
							logger.error("Failed to fetch receiver options:", error);
							return [];
						}
						return categories ?? [];
					},
					getOptionLabel: (option: EntityFormFields["receiver"]) => {
						return option?.receiver;
					},
					isOptionEqualToValue(
						option: EntityFormFields["receiver"],
						value: EntityFormFields["receiver"],
					) {
						return option?.receiver === value?.receiver;
					},
					filterOptions: (options, state) => {
						if (state.inputValue.length < 1) return options;
						const filter = createFilterOptions<(typeof options)[0]>({
							ignoreCase: true,
						});
						const filtered = filter(options, state);
						return filtered.length > 0
							? filtered
							: [
									{
										new: true,
										receiver: state.inputValue,
									},
								];
					},
					renderOption: (props, option: EntityFormFields["receiver"]) => {
						if (!option) return null;
						const isNew = "new" in option;
						return (
							<li {...props} key={option.receiver}>
								{isNew && <Chip label="New" size="small" sx={{ mr: 0.5 }} />}
								{option.receiver}
							</li>
						);
					},
					noOptionsText: "No receivers found",
				},
				{
					type: "number",
					name: "transferAmount",
					label: "Transfer Amount",
					placeholder: "Transfer Amount",
					required: true,
					slotProps: {
						input: {
							endAdornment: (
								<InputAdornment position="end">&euro;</InputAdornment>
							),
						},
					},
				},
				{
					type: "text",
					name: "information",
					label: "Information",
					placeholder: "Information",
					area: true,
					rows: 2,
				},
			];
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
			<EntityTable<TExpandedRecurringPayment>
				title="Subscriptions"
				subtitle="Manage your recurring payments"
				error={error}
				slots={{
					title: { showCount: true },
					noResults: {
						text: filters.keyword
							? `No subscriptions found for "${filters.keyword}"`
							: "No subscriptions found",
					},
					search: {
						enabled: true,
						placeholder: "Search subscriptions…",
						onSearch: handleTextSearch,
					},
					create: { enabled: true, onClick: handleCreateEntity },
				}}
				totalEntityCount={totalEntityCount}
				isLoading={status === "loading"}
				data={subscriptions ?? []}
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
					{ key: "executeAt", label: "Execute at" },
					{ key: "receiver", label: "Details" },
					{ key: "transferAmount", label: "Transfer Amount" },
					{ key: "information", label: "Information" },
					{ placeholder: true },
				]}
				renderRow={(cell, item, _data) => {
					const key = cell;
					const rowKey = String(item[key]);
					return (
						<TableRow key={rowKey}>
							<TableCell>
								<Typography
									variant="body1"
									sx={{
										textDecoration: item.paused ? "line-through" : "unset",
									}}
								>
									{/* {Formatter.date.format()} */}
									{item.executeAt}
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body1">{item.receiver}</Typography>
								<Stack flexDirection={"row"}>
									<CategoryChip
										categoryName={item.category.name}
										size="small"
										sx={{ mr: 1 }}
									/>
									<PaymentMethodChip
										paymentMethodName={item.paymentMethod.name}
										size="small"
									/>
								</Stack>
							</TableCell>
							<TableCell>
								<Typography variant="body1">
									{Formatter.currency.formatBalance(item.transferAmount)}
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body1">
									{item.information ?? "No information"}
								</Typography>
							</TableCell>
							<TableCell align="right">
								<EntityMenu<TExpandedRecurringPayment>
									entity={item}
									handleEditEntity={handleEditEntity}
									handleDeleteEntity={handleDeleteEntity}
									actions={[
										{
											children: item.paused ? "Resume" : "Pause",
											onClick: () => handleTogglePauseOnEntity(item),
										},
									]}
								/>
							</TableCell>
						</TableRow>
					);
				}}
				rowHeight={83.5}
			/>

			<EntityDrawer<EntityFormFields>
				title={"Subscription"}
				subtitle={
					drawerState.action === "CREATE"
						? "Create new subscription"
						: "Edit subscription"
				}
				open={drawerState.isOpen}
				onSubmit={handleFormSubmission}
				onClose={closeEntityDrawer}
				closeOnBackdropClick
				onResetForm={() => {
					return {
						ID: null,
						executeAt: new Date(),
						toCategory: null,
						toPaymentMethod: null,
						receiver: null,
						transferAmount: null,
						information: null,
					};
				}}
				defaultValues={drawerState.defaultValues ?? undefined}
				fields={EntityFormFields}
			/>
		</React.Fragment>
	);
};
