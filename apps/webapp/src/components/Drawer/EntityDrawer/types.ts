import type {GridProps, TextFieldProps} from '@mui/material';
import type {FieldValues, Path} from 'react-hook-form';
import type {AutocompleteField} from './Fields/AutocompleteFieldComponent';
import type {DateField} from './Fields/DateFieldComponent';
import type {NumberField} from './Fields/NumberFieldComponent';
import type {SelectField} from './Fields/SelectFieldComponent';
import type {TextField} from './Fields/TextFieldComponent';

export type FirstLevelNullable<T extends object> = {
  [P in keyof T]: T[P] | null;
};

export type BaseAttributes<T, U extends FieldValues> = {
  size?: GridProps['size'];
  name: Path<U>;
  label: string;
} & Pick<TextFieldProps, 'placeholder' | 'required' | 'slotProps'> &
  T;

export type EntityDrawerField<T extends FieldValues> =
  | DateField<T>
  | TextField<T>
  | NumberField<T>
  | AutocompleteField<T, unknown>
  | SelectField<T>;
