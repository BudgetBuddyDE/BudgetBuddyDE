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

export type TPasswordInputProps = {
  formControlProps?: FormControlProps;
  inputLabelProps?: InputLabelProps;
  outlinedInputProps?: OutlinedInputProps;
};

export const PasswordInput: React.FC<TPasswordInputProps> = ({
  formControlProps,
  inputLabelProps,
  outlinedInputProps,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FormControl variant="outlined" fullWidth required {...formControlProps}>
      <InputLabel htmlFor="outlined-adornment-password" {...inputLabelProps}>
        Password
      </InputLabel>
      <OutlinedInput
        type={showPassword ? 'text' : 'password'}
        name="password"
        label="Password"
        placeholder="Enter password"
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={() => setShowPassword(prev => !prev)}
              sx={{mr: 0}}
              edge="end">
              {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
            </IconButton>
          </InputAdornment>
        }
        {...outlinedInputProps}
      />
    </FormControl>
  );
};
