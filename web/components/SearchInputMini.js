import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import InputBase from '@material-ui/core/InputBase'
import SearchIcon from '@material-ui/icons/Search'
import CloseIcon from '@material-ui/icons/Close'

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: '3px 12px',
    display: 'flex',
    alignItems: 'center',
    // border: `1px solid ${theme.palette.background.paper}`,
    // '&:hover': {
    //   borderColor: theme.palette.grey[700],
    // },
  },
  input: {
    margin: '0 auto',
    backgroundColor: theme.palette.background.paper,
  },
  verticalDivider: {
    borderRight: `1px solid ${theme.palette.grey[300]}`,
    height: 40,
    margin: theme.spacing(0, 1.5),
  },
  actionIcons: {
    color: theme.palette.grey[500],
  },
  iconButtons: {
    color: theme.palette.grey[500],
    cursor: 'pointer',
  },
}))

export default function SearchInput(props) {
  const { value, onChange, onSubmit, onClear, ...other } = props

  const classes = useStyles()

  const [keyword, setKeyword] = React.useState(value)

  const handleChange = ({ target }) => {
    const v = target.value
    setKeyword(v)
    onChange(v)
  }
  const handleClearValue = () => {
    setKeyword('')
    onChange('')
    onClear()
  }
  const handleSubmit = e => {
    e.preventDefault()
    onSubmit(keyword)
  }

  return (
    <Paper onSubmit={handleSubmit} className={classes.root} component="form" elevation={0}>
      <InputBase
        onInput={handleChange}
        value={keyword}
        className={classes.input}
        size="small"
        placeholder="Search for item name, hero, origin"
        variant="outlined"
        color="secondary"
        fullWidth
        {...other}
      />

      {keyword !== '' ? (
        <CloseIcon className={classes.iconButtons} onClick={handleClearValue} />
      ) : (
        <SearchIcon className={classes.iconButtons} onClick={handleSubmit} />
      )}
    </Paper>
  )
}
SearchInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onClear: PropTypes.func,
}
SearchInput.defaultProps = {
  value: '',
  onChange: () => {},
  onSubmit: () => {},
  onClear: () => {},
}
