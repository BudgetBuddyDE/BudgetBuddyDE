import assert from "node:assert";

type State<TargetIdentifier = string> = {
	isOpen: boolean;
	target: TargetIdentifier | null;
};

type Action<TargetIdentifier = string> =
	| { action: "OPEN"; target: TargetIdentifier }
	| {
			action: "CONFIRM";
			callback: (entityId: TargetIdentifier) => Promise<void> | void;
			autoClose?: boolean;
	  }
	| { action: "CLOSE" }
	| { action: "CLEAR" };

export function getInitialDeleteDialogState<
	TargetIdentifier = string,
>(): State<TargetIdentifier> {
	return {
		isOpen: false,
		target: null,
	};
}

export function deleteDialogReducer<TargetIdentifier = string>(
	state: State<TargetIdentifier>,
	action: Action<TargetIdentifier>,
): State<TargetIdentifier> {
	switch (action.action) {
		case "OPEN":
			return {
				isOpen: true,
				target: action.target,
			};
		case "CONFIRM":
			assert(
				state.target !== null,
				"Target identifier must not be null on CONFIRM action",
			);
			// Execute the callback function
			// Note: This does not block the reducer; side effects should be handled carefully in real applications
			action.callback(state.target);
			return {
				isOpen: action.autoClose === false ? state.isOpen : false,
				target: null,
			};
		case "CLEAR":
		case "CLOSE":
			return { isOpen: false, target: null };
		default:
			return state;
	}
}
