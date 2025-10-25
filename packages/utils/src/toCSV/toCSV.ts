/**
 * @deprecated Use FieldOrMapping instead.
 */
export type FieldMapping<T extends object> = Set<keyof T>;
export type TransformFieldFunc<T extends object, R> = (value: T[keyof T], item: T, list: T[], index: number) => R;
export type FieldOrMapping<T extends object> =
  | keyof T
  | {field: keyof T; as: string; transform?: TransformFieldFunc<T, unknown>}
  | {field: keyof T; transform?: TransformFieldFunc<T, unknown>};
export type FieldsWithAlias<T extends object> = Array<FieldOrMapping<T>>;
export type CSVOptions = {
  separator: string;
};

export function toCSV<T extends object>(
  arr: T[],
  fields: FieldsWithAlias<T>,
  options?: Partial<{separator: string}>,
): string {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array of objects');
  }
  if (arr.length === 0) return '';

  const separator = options?.separator || ',';
  if (fields.length < 1) {
    throw new Error('No fields have been defined which are to be mapped');
  }
  const headerFields = fields.map(field => (typeof field === 'object' && 'as' in field ? field.as : field));
  const header = `${headerFields.join(separator)}\n`;
  const rows = arr
    .map((item, index) =>
      fields
        .map(field => {
          const FIELD_IS_OBJ = typeof field === 'object';
          const fieldAccessor: keyof T = FIELD_IS_OBJ ? field.field : field;
          const fieldVal = item[fieldAccessor];
          return FIELD_IS_OBJ && field.transform ? field.transform(fieldVal, item, arr, index) : fieldVal;
        })
        .join(separator),
    )
    .join('\n');

  return header + rows;
}
