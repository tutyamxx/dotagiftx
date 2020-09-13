import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import AppBar from '@material-ui/core/AppBar'
import Avatar from '@material-ui/core/Avatar'
import Toolbar from '@material-ui/core/Toolbar'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'
import Button from '@/components/Button'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import MoreIcon from '@material-ui/icons/MoreVert'
import Container from '@/components/Container'
import * as Storage from '@/service/storage'
import { CDN_URL, myProfile } from '@/service/api'
import { isOk as checkLoggedIn, clear as destroyLoginSess } from '@/service/auth'
import Link from '@/components/Link'
import SteamIcon from '@/components/SteamIcon'
import SearchInputMini from '@/components/SearchInputMini'

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
  titleMini: {
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
    padding: theme.spacing(0, 1, 0, 1),
  },
  avatar: {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
  avatarMenu: {
    marginTop: theme.spacing(4),
  },
  spacer: {
    width: theme.spacing(1),
  },
}))

const PROFILE_CACHE_KEY = 'profile'

const defaultProfile = {
  id: '',
  steam_id: '',
  name: '',
  avatar: '',
  created_at: null,
}

export default function Header({ disableSearch }) {
  const classes = useStyles()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'))

  const [profile, setProfile] = React.useState(defaultProfile)

  React.useEffect(() => {
    const get = async () => {
      const res = await myProfile.GET()
      setProfile(res)
      Storage.save(PROFILE_CACHE_KEY, res)
    }

    if (checkLoggedIn()) {
      const hit = Storage.get(PROFILE_CACHE_KEY)
      if (hit) {
        setProfile(hit)
        return
      }
      // fetch data from api
      get()
    }
  }, [])

  const [anchorEl, setAnchorEl] = React.useState(null)
  const handleClick = e => {
    setAnchorEl(e.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const [moreEl, setMoreEl] = React.useState(null)
  const handleMoreClick = e => {
    setMoreEl(e.currentTarget)
  }
  const handleMoreClose = () => {
    setMoreEl(null)
  }

  const handleLogout = () => {
    destroyLoginSess()
    handleClose()
    // eslint-disable-next-line no-undef
    window.location = '/'
  }

  const isLoggedIn = checkLoggedIn()

  return (
    <header>
      <AppBar position="static" variant="outlined" className={classes.appBar}>
        <Container disableMinHeight>
          <Toolbar variant="dense" disableGutters>
            {/* Branding button */}
            {/* Desktop nav branding */}
            <Link href="/" disableUnderline>
              {!isMobile ? (
                <Typography component="h1" className={classes.title}>
                  <strong>DotagiftX</strong>
                </Typography>
              ) : (
                <Typography component="h1" className={classes.titleMini}>
                  <strong>DX</strong>
                </Typography>
              )}
            </Link>
            <span className={classes.spacer} />
            {!disableSearch && <SearchInputMini />}

            {/* Desktop nav buttons */}
            {!isMobile && (
              <>
                <span style={{ flexGrow: 1 }} />

                {/* Post item button */}
                {isLoggedIn ? (
                  <Button variant="outlined" color="secondary" component={Link} href="/post-item">
                    Post Item
                  </Button>
                ) : (
                  <Tooltip title="You must be logged in to post an item" arrow>
                    <Button variant="outlined" color="secondary">
                      Post Item
                    </Button>
                  </Tooltip>
                )}
                <span className={classes.spacer} />

                {/* Avatar menu button */}
                {isLoggedIn ? (
                  <>
                    <Button
                      aria-controls="avatar-menu"
                      aria-haspopup="true"
                      onClick={handleClick}
                      startIcon={
                        <Avatar
                          className={classes.avatar}
                          src={profile && `${CDN_URL}/${profile.avatar}`}
                        />
                      }>
                      {profile && profile.name}
                    </Button>
                    <Menu
                      className={classes.avatarMenu}
                      id="avatar-menu"
                      anchorEl={anchorEl}
                      keepMounted
                      open={Boolean(anchorEl)}
                      onClose={handleClose}>
                      <MenuItem
                        onClick={handleClose}
                        component={Link}
                        href="/user/[id]"
                        as={`/user/${profile.steam_id}?preview`}
                        disableUnderline>
                        Profile
                      </MenuItem>
                      <MenuItem
                        onClick={handleClose}
                        component={Link}
                        href="/my-listings"
                        disableUnderline>
                        My Listings
                      </MenuItem>
                      <MenuItem
                        onClick={handleClose}
                        component={Link}
                        href="/reservations"
                        disableUnderline>
                        Reservations
                      </MenuItem>
                      <MenuItem
                        onClick={handleClose}
                        component={Link}
                        href="/history"
                        disableUnderline>
                        History
                      </MenuItem>
                      {/* <MenuItem onClick={handleClose}>Buy Orders</MenuItem> */}
                      <MenuItem onClick={handleLogout}>Sign out</MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button startIcon={<SteamIcon />} component={Link} href="/login">
                    Sign in
                  </Button>
                )}
              </>
            )}

            {/* Mobile buttons */}
            {isMobile && (
              <>
                <span className={classes.spacer} />
                <IconButton
                  aria-controls="more-menu"
                  aria-haspopup="true"
                  onClick={handleMoreClick}>
                  <MoreIcon />
                </IconButton>
                <Menu
                  className={classes.avatarMenu}
                  id="more-menu"
                  anchorEl={moreEl}
                  keepMounted
                  open={Boolean(moreEl)}
                  onClose={handleMoreClose}>
                  <MenuItem
                    onClick={handleMoreClose}
                    component={Link}
                    href="/login"
                    disableUnderline>
                    Sign in
                  </MenuItem>
                  <MenuItem
                    onClick={handleMoreClose}
                    component={Link}
                    href="/post-item"
                    disableUnderline>
                    Post Item
                  </MenuItem>
                </Menu>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>
    </header>
  )
}
Header.propTypes = {
  disableSearch: PropTypes.bool,
}
Header.defaultProps = {
  disableSearch: false,
}
