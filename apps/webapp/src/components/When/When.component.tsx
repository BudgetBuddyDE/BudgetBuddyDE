/**
 * Props for the When component.
 */
export type TWhenProps<T> = {
  when: T | undefined | null | false;
  fallback?: React.ReactNode;
  children: React.ReactNode | ((data: T) => React.ReactNode);
};

/**
 * A generic component that conditionally renders its children based on a `when` prop.
 *
 * @template T - The type of the children prop.
 * @param {TWhenProps<T>} props - The props for the When component.
 * @param {boolean} props.when - A boolean that determines whether to render the children or the fallback.
 * @param {React.ReactNode} props.children - The content to render when `when` is true.
 * @param {React.ReactNode} [props.fallback] - The content to render when `when` is false. Defaults to null if not provided.
 * @returns {React.ReactNode} The rendered content based on the `when` prop.
 */
export const When = <T,>({when, children, fallback}: TWhenProps<T>) => {
  return when ? (typeof children === 'function' ? children(when) : children) : fallback || null;
};
