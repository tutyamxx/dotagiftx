import React from 'react'
import PropTypes from 'prop-types'
import makeStyles from '@mui/styles/makeStyles'
import MuiContainer from '@mui/material/Container'

import { APP_FOOTER_HEIGHT_TOTAL } from '@/constants/app'

const maxWidth = 1000

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth,
    padding: `0 ${theme.spacing(1)}`,
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(1),
    },
  },
}))

export default function Container({ children, disableMinHeight, ...other }) {
  const classes = useStyles()

  return (
    <MuiContainer
      className={classes.root}
      disableGutters
      style={{ minHeight: disableMinHeight ? 0 : `calc(100vh - ${APP_FOOTER_HEIGHT_TOTAL}px)` }}
      {...other}>
      {children}
    </MuiContainer>
  )
}
Container.propTypes = {
  children: PropTypes.node.isRequired,
  disableMinHeight: PropTypes.bool,
}
Container.defaultProps = {
  disableMinHeight: false,
}
