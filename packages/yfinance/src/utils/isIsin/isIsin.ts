import { type Branded } from '../../branded';

/**
 * Type representing an International Securities Identification Number (ISIN).
 * ISIN is a unique code that identifies a specific securities issue.
 */
export type ISIN = Branded<string, 'ISIN'>;

/**
 * Checks if the given value is a valid ISIN (International Securities Identification Number).
 * An ISIN is a 12-character alphanumeric code that uniquely identifies a specific securities issue.
 *
 * The format of an ISIN is as follows:
 * - The first two characters are letters representing the country code.
 * - The next nine characters can be letters or digits.
 * - The last character is a digit.
 *
 * @param value - The string to be checked.
 * @returns True if the value matches the ISIN format, otherwise false.
 */
export function isIsin(value: string): value is ISIN {
  return /^([A-Z]{2})([A-Z0-9]{9})([0-9])$/.test(value);
}
