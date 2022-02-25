import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'tss-react/mui'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'

const StyledSelect = withStyles(Select, theme => ({
  root: {
    fontSize: theme.typography.fontSize,
  },
}))

export default function SelectSort({ options, variant, size, ...other }) {
  return (
    <FormControl {...{ variant, size }}>
      <StyledSelect id="select-sort" {...other}>
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  )
}
SelectSort.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object),
  variant: PropTypes.string,
  size: PropTypes.string,
}
SelectSort.defaultProps = {
  options: [],
  variant: null,
  size: null,
}
