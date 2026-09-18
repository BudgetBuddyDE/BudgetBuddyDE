import type {GridRowId} from '@mui/x-data-grid';

type MappingResult<Payload> =
  {success: true; payload: Payload[]} | {success: false; issues: Array<{rowId: GridRowId; message: string}>};

type ParseResult<Payload> =
  {success: true; data: Payload} | {success: false; error: {issues: Array<{message: string}>}};

/**
 * Validates each draft row against `schema` and collects per-row issues instead of failing on the
 * first error. `toInput` maps a row to the schema input, `validateRow` can short-circuit a row with
 * a custom message before schema parsing.
 */
export function mapDraftRowsToPayload<Row extends {id: GridRowId}, Payload>(
  rows: readonly Row[],
  schema: {safeParse: (input: unknown) => ParseResult<Payload>},
  toInput: (row: Row) => unknown,
  validateRow?: (row: Row) => string | undefined,
): MappingResult<Payload> {
  const issues: Array<{rowId: GridRowId; message: string}> = [];
  const payload: Payload[] = [];

  for (const row of rows) {
    const validationError = validateRow?.(row);
    if (validationError) {
      issues.push({rowId: row.id, message: validationError});
      continue;
    }

    const parsed = schema.safeParse(toInput(row));
    if (!parsed.success) {
      issues.push({
        rowId: row.id,
        message: parsed.error.issues.map(issue => issue.message).join(', '),
      });
      continue;
    }

    payload.push(parsed.data);
  }

  return issues.length > 0 ? {success: false, issues} : {success: true, payload};
}
