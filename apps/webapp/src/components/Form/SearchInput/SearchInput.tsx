'use client';

import {ClearRounded, SearchRounded as SearchIcon} from '@mui/icons-material';
import {alpha, IconButton, InputAdornment, InputBase, type InputBaseProps, styled} from '@mui/material';
import debounce from 'lodash.debounce';
import React from 'react';

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

export type SearchInputProps = Omit<InputBaseProps, 'onChange' | 'value' | 'defaultValue'> & {
  onSearch: (text: string) => void;
  debounceWaitInMilliseconds?: number;
  defaultValue?: string;
  // Used in slots but must not be passed to the DOM
  enabled?: boolean;
};

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search…',
  onSearch,
  sx,
  debounceWaitInMilliseconds = 500,
  defaultValue = '',
  // get enabled prop; if explicitly false, disable the field (without overriding props.disabled)
  enabled,
  ...props
}) => {
  const [value, setValue] = React.useState(defaultValue);

  // Sync with external defaultValue changes (e.g. URL cleared after navigation)
  React.useEffect(() => {
    setValue(defaultValue ?? '');
  }, [defaultValue]);

  const debouncedSearch = React.useMemo(
    () => debounce((text: string) => onSearch(text), debounceWaitInMilliseconds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debounceWaitInMilliseconds, onSearch],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleClear = () => {
    setValue('');
    debouncedSearch.cancel();
    onSearch('');
  };

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
        {...props}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        endAdornment={
          value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                aria-label="clear search"
                edge="end"
                sx={{mr: 0.5, color: 'inherit', opacity: 0.7, '&:hover': {opacity: 1}}}
              >
                <ClearRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
      />
    </Search>
  );
};
