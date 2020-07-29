import React from 'react'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import SubmitIcon from '@material-ui/icons/Check'
import { catalog, myMarket } from '@/service/api'
import * as format from '@/lib/format'
import Button from '@/components/Button'
import ItemAutoComplete from '@/components/ItemAutoComplete'
import ItemImage from '@/components/ItemImage'

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

const defaultPayload = {
  item_id: '',
  price: '',
  qty: 1,
  notes: '',
}

const checkMarketPayload = payload => {
  if (!payload.item_id) {
    return 'item reference is required'
  }

  if (Number(payload.price) <= 0) {
    return 'Price must be atleast 0.01'
  }

  return null
}

export default function MarketForm() {
  const classes = useStyles()

  const [item, setItem] = React.useState({ id: '' })
  const [payload, setPayload] = React.useState(defaultPayload)
  const [error, setError] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  const handleItemSelect = val => {
    setItem(val)
    // Get item starting price
    if (val.slug) {
      catalog(val.slug).then(res => {
        setPayload({ ...payload, item_id: val.slug })
        setItem(res)
      })
    }
  }

  const router = useRouter()

  const handleSubmit = evt => {
    evt.preventDefault()

    // format and validate payload
    const newMarket = {
      item_id: payload.item_id,
      price: Number(payload.price),
      notes: payload.notes,
    }

    const err = checkMarketPayload(newMarket)
    if (err) {
      setError(`Error: ${err}`)
      return
    }

    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await myMarket.POST(newMarket)
        console.log('market successfully created!', res)
        // redirect to user listings
        setError('Item posted successfully! You will be redirected to your item listings.')
        setTimeout(() => {
          router.push('/my-listings')
        }, 3000)
      } catch (e) {
        setError(`Error: ${e.message}`)
      }

      setLoading(false)
    })()
  }

  return (
    <Paper component="form" className={classes.root} onSubmit={handleSubmit}>
      <Typography variant="h5" component="h1">
        Listing your item on DotagiftX
      </Typography>
      <br />

      <ItemAutoComplete onSelect={handleItemSelect} disabled={loading} />
      {/* <TextField */}
      {/*  variant="outlined" */}
      {/*  fullWidth */}
      {/*  required */}
      {/*  color="secondary" */}
      {/*  label="Item name" */}
      {/*  helperText="Search item you want to post from your inventory." */}
      {/*  autoFocus */}
      {/* /> */}
      <br />

      {/* Selected item preview */}
      {item.id && (
        <div>
          <ItemImage
            className={classes.itemImage}
            image={`/300x170/${item.image}`}
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
            <Typography variant="body2" color="textPrimary" component="span">
              {item.rarity}
            </Typography>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Hero:{' '}
            <Typography variant="body2" color="textPrimary" component="span">
              {item.hero}
            </Typography>
          </Typography>
          {item.lowest_ask && (
            <Typography variant="body2" color="textSecondary">
              Starting at:{' '}
              <Typography variant="body2" color="textPrimary" component="span">
                {format.amount(item.lowest_ask, 'USD')}
              </Typography>
            </Typography>
          )}
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
          onInput={e => setPayload({ ...payload, price: e.target.value })}
          onBlur={e => {
            const price = format.amount(e.target.value)
            setPayload({ ...payload, price })
          }}
          disabled={loading}
        />
        <TextField
          variant="outlined"
          color="secondary"
          label="Qty"
          type="number"
          defaultValue="1"
          style={{ width: '30%', marginLeft: '1%' }}
          onInput={e => setPayload({ ...payload, qty: e.target.value })}
          disabled={loading}
        />
      </div>
      <br />
      <TextField
        variant="outlined"
        fullWidth
        color="secondary"
        label="Notes"
        helperText="Keep it short, This will be display when they check your offer."
        onInput={e => setPayload({ ...payload, notes: e.target.value })}
        disabled={loading}
      />
      <br />
      <br />

      <Button
        variant="contained"
        fullWidth
        type="submit"
        size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={22} /> : <SubmitIcon />}>
        Post Item
      </Button>
      {error && (
        <Typography align="center" variant="body2">
          {error}
        </Typography>
      )}
    </Paper>
  )
}
