import React, {ReactNode, useEffect, useState} from 'react';

export type TParentSizeProps = {
  children: (size: {width: number; height: number}) => ReactNode;
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
export const ParentSize: React.FC<TParentSizeProps> = ({children}) => {
  const [size, setSize] = useState({width: 0, height: 0});
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();

    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return <div ref={containerRef}>{children(size)}</div>;
};
