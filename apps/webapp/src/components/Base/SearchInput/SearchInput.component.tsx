import {SearchRounded as SearchIcon} from '@mui/icons-material';
import {InputBase, type SxProps, type Theme, alpha, styled} from '@mui/material';
import {debounce} from 'lodash';
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

export type TSearchInputProps = {
  sx?: SxProps<Theme>;
  placeholder?: string;
  onSearch: (text: string) => void;
};

export const SearchInput: React.FC<TSearchInputProps> = ({placeholder = 'Search…', onSearch, sx}) => {
  return (
    <Search sx={sx}>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder={placeholder}
        inputProps={{'aria-label': 'search'}}
        onChange={debounce(e => onSearch(e.target.value), 150)}
      />
    </Search>
  );
};
