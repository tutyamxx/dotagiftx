import React, { useContext, useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import CircularProgress from '@material-ui/core/CircularProgress'
import Alert from '@material-ui/lab/Alert'
import SubmitIcon from '@material-ui/icons/Check'
import * as format from '@/lib/format'
import { myMarket } from '@/service/api'
import Link from '@/components/Link'
import ItemImage from '@/components/ItemImage'
import AppContext from '@/components/AppContext'
import { MARKET_NOTES_MAX_LEN, MARKET_TYPE_BID } from '@/constants/market'
import { itemRarityColorMap } from '@/constants/palette'
import DialogCloseButton from '@/components/DialogCloseButton'
import Button from '@/components/Button'

const useStyles = makeStyles(theme => ({
  details: {
    [theme.breakpoints.down('xs')]: {
      textAlign: 'center',
      display: 'block',
    },
    display: 'inline-flex',
  },
  profileName: {
    [theme.breakpoints.down('xs')]: {
      fontSize: theme.typography.h6.fontSize,
    },
  },
  avatar: {
    [theme.breakpoints.down('xs')]: {
      margin: '0 auto',
    },
    width: 100,
    height: 100,
    marginRight: theme.spacing(1.5),
  },
  itemImage: {
    width: 150,
    height: 100,
    float: 'left',
    marginRight: theme.spacing(1),
  },
  spacer: {
    width: theme.spacing(1),
  },
}))

const checkPayload = payload => {
  if (Number(payload.price) < 0.5) {
    return 'Price must be atleast 0.50 USD'
  }

  const notesLen = String(payload.notes).length
  if (notesLen > MARKET_NOTES_MAX_LEN) {
    return `Notes max length limit reached ${notesLen}/${MARKET_NOTES_MAX_LEN}`
  }

  return null
}

export default function BuyOrderDialog(props) {
  const classes = useStyles()
  const { isMobile, isLoggedIn } = useContext(AppContext)

  const { catalog, open, onClose, onChange } = props

  const [market, setMarket] = useState(null)
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = evt => {
    evt.preventDefault()

    // format and validate payload
    const buyOrder = {
      type: MARKET_TYPE_BID,
      item_id: catalog.id,
      price: Number(price),
      notes: String(notes).trim(),
    }
    const err = checkPayload(buyOrder)
    if (err) {
      setError(`Error: ${err}`)
      return
    }

    // submit buy order payload
    setError(null)
    setLoading(true)
    ;(async () => {
      try {
        const res = await myMarket.POST(buyOrder)
        setMarket(res)
        onChange()
      } catch (e) {
        // special case reword error
        let m = e.message
        if (e.message === 'market bid should be lower than lowest ask price') {
          m = 'buy order price should be lower than lowest offer price'
        }

        setError(`Error: ${m}`)
      }

      setLoading(false)
    })()
  }

  const router = useRouter()
  const handleClose = isChanged => {
    onClose(isChanged)
    setTimeout(() => {
      setError(null)
      setLoading(false)
      setNotes('')
      setPrice('')
      setMarket(null)
    }, 500)

    if (market) {
      // Forces to refresh buy order table
      router.push(`${router.query.slug}?buyorder`)
    }
  }

  const handleDone = () => {
    handleClose()
  }

  const handlePriceChange = evt => setPrice(evt.target.value)

  const isInputDisabled = loading || Boolean(market) || !isLoggedIn

  return (
    <Dialog
      fullScreen={isMobile}
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description">
      <form onSubmit={handleSubmit}>
        <DialogTitle id="alert-dialog-title">
          <DialogCloseButton onClick={handleClose} />
          Buy - {catalog.name}
        </DialogTitle>
        <DialogContent>
          {!isLoggedIn && (
            <>
              <Alert severity="warning">
                You must be signed in to place buy order — <Link href="/login">Sign in now</Link>
              </Alert>
              <br />
            </>
          )}

          <div>
            <ItemImage
              className={classes.itemImage}
              image={catalog.image}
              width={150}
              height={100}
              rarity={catalog.rarity}
              title={catalog.name}
            />
            <Typography variant="body2" color="textSecondary">
              Origin:{' '}
              <Typography variant="body2" color="textPrimary" component="span">
                {catalog.origin}
              </Typography>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Rarity:{' '}
              <Typography
                variant="body2"
                color="textPrimary"
                component="span"
                style={{
                  textTransform: 'capitalize',
                  color: itemRarityColorMap[catalog.rarity],
                }}>
                {catalog.rarity}
              </Typography>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Hero:{' '}
              <Typography variant="body2" color="textPrimary" component="span">
                {catalog.hero}
              </Typography>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Lowest Price:{' '}
              <Link href={`/${catalog.slug}`}>
                {catalog.lowest_ask ? format.amount(catalog.lowest_ask, 'USD') : 'no offers yet'}
              </Link>
            </Typography>
            <br />
            <br />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="textSecondary" style={{ marginTop: -22 }}>
              <Typography color="textPrimary" component="span">
                {catalog.bid_count}
              </Typography>{' '}
              requests to buy at{' '}
              <Typography color="textPrimary" component="span">
                {format.amount(catalog.highest_bid, 'USD')}
              </Typography>{' '}
              or lower
            </Typography>
            <span className={classes.spacer} />
            <TextField
              required
              variant="outlined"
              color="secondary"
              label="Price"
              placeholder="1.00"
              type="number"
              helperText="Price you want to pay in USD."
              disabled={isInputDisabled}
              value={price}
              onInput={handlePriceChange}
              onChange={handlePriceChange}
              onBlur={e => {
                const p = format.amount(e.target.value)
                setPrice(p)
              }}
            />
          </div>
          <br />
          <TextField
            disabled={isInputDisabled}
            fullWidth
            color="secondary"
            variant="outlined"
            label="Notes"
            helperText="Keep it short, This will be displayed when they check your order."
            value={notes}
            onInput={e => setNotes(e.target.value)}
          />
          <br />
          <br />
          {!market && (
            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              target="_blank"
              rel="noreferrer noopener"
              disabled={isInputDisabled}
              startIcon={loading ? <CircularProgress size={22} color="inherit" /> : <SubmitIcon />}>
              Place Order
            </Button>
          )}
          <div style={{ marginTop: 2 }}>
            {Boolean(market) && (
              <Alert
                severity="success"
                variant="filled"
                action={
                  <Button color="inherit" size="small" onClick={handleDone}>
                    Done
                  </Button>
                }>
                Your buy order has been placed and now open for sellers. Check your{' '}
                <Link style={{ textDecoration: 'underline' }} href="/my-orders">
                  Buy orders
                </Link>
                .
              </Alert>
            )}
            {error && (
              <Typography align="center" variant="body2" color="error">
                {error}
              </Typography>
            )}
          </div>
          <Typography variant="body2" color="textSecondary" component="div">
            <br />
            Placing buy order on Giftables
            <ul>
              <li>
                Buyer profile details are{' '}
                <Typography component="span" variant="inherit" color="textPrimary">
                  only visible
                </Typography>{' '}
                to signed in website users.
              </li>
              <li>
                As Giftables involves a party having to go first, please always check seller&apos;s
                reputation through&nbsp;
                <Link
                  style={{ textDecoration: 'underline' }}
                  href="https://steamrep.com"
                  target="_blank"
                  rel="noreferrer noopener">
                  SteamRep
                </Link>
                .
              </li>
              <li>
                Payment agreements will be done between you and the seller. This website does not
                accept or integrate any payment service.
              </li>
              <li>
                Please kindly remove this buy order after use to prevent seller&apos;s contacting
                you.
              </li>
            </ul>
          </Typography>
        </DialogContent>
      </form>
    </Dialog>
  )
}
BuyOrderDialog.propTypes = {
  catalog: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onChange: PropTypes.func,
}
BuyOrderDialog.defaultProps = {
  open: false,
  onClose: () => {},
  onChange: () => {},
}
