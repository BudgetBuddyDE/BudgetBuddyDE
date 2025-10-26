"use client";

import React from "react";

export type ParentSizeProps = {
	children: (size: { width: number; height: number }) => React.ReactNode;
};

/**
 * A component that provides the size of its parent container to its children.
 *
 * @component
 * @example
 * ```tsx
 * <ParentSize>
 *   {(size) => (
 *     <div>
 *       Width: {size.width}px
 *       Height: {size.height}px
 *     </div>
 *   )}
 * </ParentSize>
 * ```
 */
export const ParentSize: React.FC<ParentSizeProps> = ({ children }) => {
	const [size, setSize] = React.useState({ width: 0, height: 0 });
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				setSize({
					width: containerRef.current.offsetWidth,
					height: containerRef.current.offsetHeight,
				});
			}
		};

		updateSize();

		window.addEventListener("resize", updateSize);

		return () => window.removeEventListener("resize", updateSize);
	}, []);

	return <div ref={containerRef}>{children(size)}</div>;
};
