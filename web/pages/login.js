import React, { useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import { APP_NAME } from '@/constants/strings'
import { APP_CACHE_PROFILE } from '@/constants/app'
import * as Storage from '@/service/storage'
import { authSteam, getLoginURL, myProfile } from '@/service/api'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Container from '@/components/Container'
import Button from '@/components/Button'
import SteamIcon from '@/components/SteamIcon'
import { set as setAuth } from '@/service/auth'
import AppContext from '@/components/AppContext'
import Link from '@/components/Link'

const useStyles = makeStyles(theme => ({
  main: {
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(2),
    },
    marginTop: theme.spacing(4),
  },
  warningText: {
    color: theme.palette.info.main,
  },
  list: {
    listStyle: 'none',
    '& li:before': {
      content: `'✔ '`,
    },
  },
}))

export default function Login() {
  const classes = useStyles()
  const { isLoggedIn } = useContext(AppContext)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const router = useRouter()
  if (isLoggedIn) {
    router.push('/my-listings')
    return null
  }

  React.useEffect(() => {
    // eslint-disable-next-line no-undef
    const query = window.location.search
    const login = async () => {
      setLoading(true)
      try {
        // Store auth details.
        const auth = await authSteam(query)
        setAuth(auth)
        Storage.removeAll()

        // Store user profile.
        const profile = await myProfile.GET()
        Storage.save(APP_CACHE_PROFILE, profile)

        // eslint-disable-next-line no-undef
        window.location = '/'
      } catch (e) {
        setError(e)
        setLoading(false)
      }
    }

    if (query) {
      login()
    }
  }, [])

  return (
    <>
      <Head>
        <title>{APP_NAME} :: Sign In</title>
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          <Typography variant="h5" component="h1" gutterBottom>
            Signing in to <strong>{APP_NAME}</strong> allows you to access additional features.
          </Typography>
          <Typography component="h2">
            <ul className={classes.list}>
              <li>Post Items</li>
              <li>Track Reservations</li>
              <li>Record Sales History</li>
              {/* <li>Place Buy Order</li> */}
            </ul>
          </Typography>
          <br />

          <Typography className={classes.warningText}>
            This website is not affiliated with Valve Corporation or Steam.
          </Typography>
          <br />

          <Button
            disabled={loading}
            onClick={() => setLoading(true)}
            startIcon={loading ? <CircularProgress color="secondary" size={22} /> : <SteamIcon />}
            variant="outlined"
            size="large"
            href={getLoginURL}>
            Sign in through Steam
          </Button>
          {error && <Typography color="error">{error.message}</Typography>}
          <Typography />
          <br />
          <br />

          <Typography color="textSecondary" variant="body2">
            By signing in, We ask for public information about your account from the{' '}
            <Link
              target="_blank"
              rel="noreferrer noopener"
              href="https://developer.valvesoftware.com/wiki/Steam_Web_API"
              color="secondary">
              Steam Web API
            </Link>{' '}
            this includes (<em>steam id, profile name, and avatar image</em>) and use cookies to
            keep your signed in session active.
          </Typography>
        </Container>
      </main>

      <Footer />
    </>
  )
}
