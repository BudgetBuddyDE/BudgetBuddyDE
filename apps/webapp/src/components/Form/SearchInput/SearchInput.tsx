'use client';

import {SearchRounded as SearchIcon} from '@mui/icons-material';
import {alpha, InputBase, type InputBaseProps, styled} from '@mui/material';
import debounce from 'lodash.debounce';
import type React from 'react';

const Search = styled('div')(({theme}) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({theme}) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({theme}) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

export type SearchInputProps = Omit<InputBaseProps, 'onChange'> & {
  onSearch: (text: string) => void;
  debounceWaitInMilliseconds?: number;
  // Used in slots but must not be passed to the DOM
  enabled?: boolean;
};

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search…',
  onSearch,
  sx,
  debounceWaitInMilliseconds = 500,
  // get enbaled prop; if explicitly false, disable the field (without overriding props.disabled)
  enabled,
  ...props
}) => {
  // If enabled is explicitly false, disable the field (without overriding props.disabled)
  const disabled = props.disabled ?? enabled === false;

  return (
    <Search sx={sx}>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder={placeholder}
        inputProps={{'aria-label': 'search'}}
        onChange={debounce(e => onSearch(e.target.value), debounceWaitInMilliseconds)}
        disabled={disabled}
        {...props}
      />
    </Search>
  );
};
