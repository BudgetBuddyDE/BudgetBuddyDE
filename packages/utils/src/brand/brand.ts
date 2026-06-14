declare const __brand: unique symbol;

export type Branded<T, B> = T & {readonly [__brand]: B};
