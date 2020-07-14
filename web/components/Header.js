import React from 'react'
import useSWR from 'swr'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Button from '@/components/Button'
import Container from '@/components/Container'
import Link from '@/components/Link'
import SteamIcon from '@/components/SteamIcon'
import { fetcherWithToken, MY_PROFILE } from '@/service/api'
import { isOk as isLoggedIn } from '@/service/auth'

const useStyles = makeStyles(theme => ({
  root: {},
  appBar: {
    borderTop: 'none',
    borderRight: 'none',
    borderLeft: 'none',
  },
  title: {
    [theme.breakpoints.down('sm')]: {
      fontSize: 15,
    },
    fontSize: 17,
    textShadow: '0px 0px 16px #C79123',
    // textTransform: 'uppercase',
    // fontWeight: 'bold',
    background: 'linear-gradient(#F8E8B9 10%, #fff 90%)',
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    filter: 'drop-shadow(0px 0px 10px black)',
    letterSpacing: 2,
    cursor: 'pointer',
  },
}))

export default function () {
  const classes = useStyles()

  const { data: profile, error } = useSWR(MY_PROFILE, fetcherWithToken)

  console.log(profile)

  return (
    <header>
      <AppBar position="static" variant="outlined" className={classes.appBar}>
        <Container disableMinHeight>
          <Toolbar variant="dense" disableGutters>
            <Link href="/" disableUnderline>
              <Typography component="h1" className={classes.title}>
                <strong>DotagiftX</strong>
              </Typography>
            </Link>
            <span style={{ flexGrow: 1 }} />
            {isLoggedIn() ? (
              <span>{!error && profile && profile.name}</span>
            ) : (
              <Button startIcon={<SteamIcon />} component={Link} href="/login">
                Sign in
              </Button>
            )}
            &nbsp;&nbsp;
            <Button variant="outlined" color="secondary">
              Post Item
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
    </header>
  )
}
