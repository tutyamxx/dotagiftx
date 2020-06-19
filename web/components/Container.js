import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Component from '@material-ui/core/Container'

const useStyles = makeStyles(theme => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
  },
}))

export default function Container({ children, disableMinHeight }) {
  const classes = useStyles()

  return (
    <Component
      className={classes.root}
      maxWidth="md"
      disableGutters
      style={{ minHeight: disableMinHeight ? 0 : '40vh' }}>
      {children}
    </Component>
  )
}
Container.propTypes = {
  children: PropTypes.node.isRequired,
  disableMinHeight: PropTypes.bool,
}
Container.defaultProps = {
  disableMinHeight: false,
}
