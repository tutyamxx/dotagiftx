import React, { useContext } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import SubmitIcon from '@material-ui/icons/Check'
import Alert from '@material-ui/lab/Alert'
import { catalog, myMarket } from '@/service/api'
import { APP_NAME } from '@/constants/strings'
import { itemRarityColorMap } from '@/constants/palette'
import * as format from '@/lib/format'
import Button from '@/components/Button'
import ItemAutoComplete from '@/components/ItemAutoComplete'
import ItemImage from '@/components/ItemImage'
import Link from '@/components/Link'
import { MARKET_NOTES_MAX_LEN, MARKET_QTY_LIMIT } from '@/constants/market'
import AppContext from '@/components/AppContext'

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: theme.breakpoints.values.sm,
    margin: '0 auto',
    padding: theme.spacing(2),
  },
  itemImage: {
    width: 150,
    height: 100,
    float: 'left',
    marginRight: theme.spacing(1),
  },
}))

const defaultItem = {
  id: '',
}
const defaultPayload = {
  item_id: '',
  price: '',
  qty: 1,
  notes: '',
}

const checkMarketPayload = payload => {
  if (!payload.item_id) {
    return 'Item reference should be valid'
  }

  if (Number(payload.price) <= 0) {
    return 'Price must be atleast 0.01 USD'
  }

  if (Number(payload.quantity) > MARKET_QTY_LIMIT) {
    return `Quantity limit ${MARKET_QTY_LIMIT} per post`
  }

  const notesLen = String(payload.notes).length
  if (notesLen > MARKET_NOTES_MAX_LEN) {
    return `Notes max length limit reached ${notesLen}/${MARKET_NOTES_MAX_LEN}`
  }

  return null
}

export default function MarketForm() {
  const classes = useStyles()
  const { isLoggedIn } = useContext(AppContext)

  const [item, setItem] = React.useState(defaultItem)
  const [payload, setPayload] = React.useState(defaultPayload)
  const [newMarketID, setNewMarketID] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  const handleItemSelect = val => {
    // Reset values when item is selected
    const newPayload = { ...defaultPayload }
    setPayload(newPayload)
    setNewMarketID(null)
    setError(null)

    setItem(val)
    // get item starting price
    if (val.slug) {
      setPayload({ ...newPayload, item_id: val.slug })
      catalog(val.slug)
        .then(res => {
          setItem(res)
        })
        .catch(e => {
          console.log('error getting catalog info', e.message)
        })
    }
  }

  const handleSubmit = evt => {
    evt.preventDefault()

    // format and validate payload
    const quantity = Number(payload.qty)
    const newMarket = {
      item_id: payload.item_id,
      price: Number(payload.price),
      notes: String(payload.notes).trim(),
    }

    const err = checkMarketPayload({ ...newMarket, quantity })
    if (err) {
      setError(`Error: ${err}`)
      return
    }

    setLoading(true)
    setError(null)
    setNewMarketID(null)
    ;(async () => {
      try {
        let res
        for (let i = 0; i < quantity; i++) {
          // eslint-disable-next-line no-await-in-loop
          res = await myMarket.POST(newMarket)
        }

        // redirect to user listings
        if (res) {
          setNewMarketID(res.id)
          // setError('Item posted successfully! You will be redirected to your item listings.')
          // setTimeout(() => {
          //   router.push('/my-listings')
          // }, 3000)
        }
      } catch (e) {
        // special case reword error
        let m = e.message
        if (e.message === 'market ask should be higher than highest bid price') {
          m = 'sell price should be higher than current buy order price'
        }

        setError(`Error: ${m}`)
      }

      setLoading(false)
    })()
  }

  const itemSelectEl = React.useRef(null)
  const handleFormReset = () => {
    setItem(defaultItem)
    setPayload(defaultPayload)
    setNewMarketID(null)
    setError(null)

    const inputEl = itemSelectEl.current.getElementsByTagName('input')[0]
    // inputEl.focus()
    inputEl.select()
  }

  const handlePriceChange = e => setPayload({ ...payload, price: e.target.value })

  const handleQtyChange = e => {
    const qty = e.target.value
    setPayload({ ...payload, qty })
  }

  return (
    <>
      {!isLoggedIn && (
        <>
          <Alert severity="warning">
            You must be signed in to post an item — <Link href="/login">Sign in now</Link>
          </Alert>
          <br />
        </>
      )}

      <Paper component="form" className={classes.root} onSubmit={handleSubmit}>
        <Typography variant="h5" component="h1">
          Post your item on {APP_NAME}
        </Typography>
        <br />

        <ItemAutoComplete
          ref={itemSelectEl}
          onSelect={handleItemSelect}
          disabled={loading || !isLoggedIn}
        />
        <br />

        {/* Selected item preview */}
        {item.id && (
          <div>
            <ItemImage
              className={classes.itemImage}
              image={item.image}
              width={150}
              height={100}
              rarity={item.rarity}
              title={item.name}
            />
            <Typography variant="body2" color="textSecondary">
              Origin:{' '}
              <Typography variant="body2" color="textPrimary" component="span">
                {item.origin}
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
                  color: itemRarityColorMap[item.rarity],
                }}>
                {item.rarity}
              </Typography>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Hero:{' '}
              <Typography variant="body2" color="textPrimary" component="span">
                {item.hero}
              </Typography>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Starting at:{' '}
              <Link href={`/${item.slug}`}>
                {item.lowest_ask ? format.amount(item.lowest_ask, 'USD') : 'no offers yet'}
              </Link>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Request to buy at:{' '}
              <Link href={`/${item.slug}?buyorder`}>
                {item.highest_bid ? format.amount(item.highest_bid, 'USD') : 'no orders yet'}
              </Link>
            </Typography>
            <br />
            <br />
          </div>
        )}

        <div>
          <TextField
            variant="outlined"
            required
            color="secondary"
            label="Price"
            placeholder="1.00"
            type="number"
            helperText="Price value will be on USD."
            style={{ width: '69%' }}
            value={payload.price}
            onInput={handlePriceChange}
            onChange={handlePriceChange}
            onBlur={e => {
              const price = format.amount(e.target.value)
              setPayload({ ...payload, price })
            }}
            disabled={loading || !isLoggedIn || Boolean(newMarketID)}
          />
          <TextField
            variant="outlined"
            color="secondary"
            label="Qty"
            type="number"
            value={payload.qty}
            style={{ width: '30%', marginLeft: '1%' }}
            onInput={handleQtyChange}
            onChange={handleQtyChange}
            onBlur={e => {
              let qty = Number(e.target.value)
              if (qty < 1) {
                qty = 1
              }
              setPayload({ ...payload, qty })
            }}
            disabled={loading || !isLoggedIn || Boolean(newMarketID)}
          />
        </div>
        <br />
        <TextField
          variant="outlined"
          fullWidth
          color="secondary"
          label="Notes"
          value={payload.notes}
          helperText="Keep it short, This will be displayed when they check your offer."
          onInput={e => setPayload({ ...payload, notes: e.target.value })}
          disabled={loading || !isLoggedIn || Boolean(newMarketID)}
        />
        <br />
        <br />

        {!newMarketID && (
          <Button
            variant="contained"
            fullWidth
            type="submit"
            size="large"
            disabled={loading || !isLoggedIn || Boolean(newMarketID)}
            startIcon={loading ? <CircularProgress size={22} /> : <SubmitIcon />}>
            Post Item
          </Button>
        )}
        <div style={{ marginTop: 2 }}>
          {newMarketID && (
            <Alert
              severity="success"
              variant="filled"
              action={
                <Button color="inherit" size="small" onClick={handleFormReset}>
                  Post More
                </Button>
              }>
              Item posted successfully! Check your{' '}
              <Link style={{ textDecoration: 'underline' }} href="/my-listings">
                Item Listings
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
          Guides for selling Giftables
          <ul>
            <li>Please make sure your item exist in your inventory.</li>
            <li>
              Dota 2 giftables transaction only viable if the two steam user parties have been
              friends for 30 days.
            </li>
            <li>
              Please be clear in your terms and price. If the price is variable and subject to
              change, make a new post and remove the old one.
            </li>
            <li>
              Payment agreements will be done between you and the buyer. This website does not
              accept or integrate any payment service.
            </li>
          </ul>
        </Typography>
      </Paper>
    </>
  )
}
