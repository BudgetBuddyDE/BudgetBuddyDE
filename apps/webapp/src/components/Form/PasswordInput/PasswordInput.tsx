'use client';

import {VisibilityOffRounded, VisibilityRounded} from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FormControl variant="outlined" fullWidth required {...formControlProps} disabled={disabled}>
      <InputLabel htmlFor="outlined-adornment-password" {...inputLabelProps}>
        {outlinedInputProps?.label || 'Password'}
      </InputLabel>
      <OutlinedInput
        type={showPassword ? 'text' : 'password'}
        name="password"
        label="Password"
        placeholder="Enter password"
        disabled={disabled}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
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
