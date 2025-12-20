export function debounce<T extends (...args: unknown[]) => void>(
	fn: T,
	delay: number,
) {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	const debounced = (...args: Parameters<T>) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			fn(...args);
			timeout = null;
		}, delay);
	};

	debounced.cancel = () => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

	return debounced as T & { cancel: () => void };
}
