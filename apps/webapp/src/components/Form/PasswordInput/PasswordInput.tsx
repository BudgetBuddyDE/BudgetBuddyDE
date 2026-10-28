'use client';

import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import {
  FormControl,
  type FormControlProps,
  IconButton,
  InputAdornment,
  InputLabel,
  type InputLabelProps,
  OutlinedInput,
  type OutlinedInputProps,
} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';

export type PasswordInputProps = {
  formControlProps?: FormControlProps;
  inputLabelProps?: InputLabelProps;
  outlinedInputProps?: OutlinedInputProps;
  disabled?: boolean;
};

export const PasswordInput: React.FC<PasswordInputProps> = ({
  formControlProps,
  inputLabelProps,
  outlinedInputProps,
  disabled = false,
}) => {
  const t = useTranslations('Form');
  const [showPassword, setShowPassword] = React.useState(false);
  const inputId = React.useId();
  const label = outlinedInputProps?.label || t('password');

  return (
    <FormControl variant="outlined" fullWidth required {...formControlProps} disabled={disabled}>
      <InputLabel htmlFor={inputId} {...inputLabelProps}>
        {label}
      </InputLabel>
      <OutlinedInput
        id={inputId}
        type={showPassword ? 'text' : 'password'}
        name="password"
        label={label}
        placeholder={t('enterPassword')}
        disabled={disabled}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label={t(showPassword ? 'hidePassword' : 'showPassword')}
              onClick={() => setShowPassword(prev => !prev)}
              sx={{mr: 0}}
              edge="end"
            >
              {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
            </IconButton>
          </InputAdornment>
        }
        {...outlinedInputProps}
      />
    </FormControl>
  );
};
