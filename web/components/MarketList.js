import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import has from 'lodash/has'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import { debounce } from '@material-ui/core'
import bidColor from '@material-ui/core/colors/teal'
import Avatar from '@material-ui/core/Avatar'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Tab from '@material-ui/core/Tab'
import Tabs from '@material-ui/core/Tabs'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import { VERIFIED_INVENTORY_MAP_ICON } from '@/constants/verified'
import { myMarket } from '@/service/api'
import { amount, dateFromNow } from '@/lib/format'
import Link from '@/components/Link'
import Button from '@/components/Button'
import BuyButton from '@/components/BuyButton'
import TableHeadCell from '@/components/TableHeadCell'
import ContactDialog from '@/components/ContactDialog'
import ContactBuyerDialog from '@/components/ContactBuyerDialog'
import { MARKET_STATUS_REMOVED } from '@/constants/market'
import { retinaSrcSet } from '@/components/ItemImage'
import AppContext from '@/components/AppContext'
import SellButton from '@/components/SellButton'
import { VerifiedStatusPopover } from '@/components/VerifiedStatusCard'

const useStyles = makeStyles(theme => ({
  seller: {
    display: 'flex',
    padding: theme.spacing(2),
  },
  avatar: {
    marginRight: theme.spacing(1.5),
  },
  tableHead: {
    // background: theme.palette.grey[900],
    background: '#202a2f',
  },
  tabs: {
    '& .MuiTabs-indicator': {
      background: theme.palette.grey[100],
    },
  },
}))

const buyOrderKeyQuery = 'buyorder'

export default function MarketList({ offers, buyOrders, error, loading, pagination }) {
  const classes = useStyles()
  const { isMobile, currentAuth } = useContext(AppContext)
  const currentUserID = currentAuth.user_id || null

  const [tabIdx, setTabIdx] = React.useState(0)

  const router = useRouter()
  useEffect(() => {
    if (has(router.query, buyOrderKeyQuery)) {
      setTabIdx(1)
    } else {
      setTabIdx(0)
    }
  }, [router.query])

  const handleTabChange = (e, value) => {
    setTabIdx(value)
    let p = `/${router.query.slug}`
    if (value === 1) {
      p += `?${buyOrderKeyQuery}`
    }

    router.push(p)
  }

  const [currentMarket, setCurrentMarket] = React.useState(null)
  const handleContactClick = marketIdx => {
    let src = offers
    if (tabIdx === 1) {
      src = buyOrders
    }

    setCurrentMarket(src.data[marketIdx])
  }
  const handleRemoveClick = marketIdx => {
    let src = offers
    if (tabIdx === 1) {
      src = buyOrders
    }

    const mktID = src.data[marketIdx].id
    ;(async () => {
      try {
        await myMarket.PATCH(mktID, { status: MARKET_STATUS_REMOVED })
        router.reload()
      } catch (e) {
        console.error(`Error: ${e.message}`)
      }
    })()
  }

  const offerListLoading = !offers && loading
  const buyOrderLoading = !buyOrders.data

  return (
    <>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="market list table">
          <TableHead className={classes.tableHead}>
            <TableRow>
              <TableHeadCell colSpan={3} padding="none">
                <Tabs
                  className={classes.tabs}
                  variant="fullWidth"
                  value={tabIdx}
                  onChange={handleTabChange}>
                  <Tab
                    value={0}
                    label={`${offers.total_count || ''} Offers`}
                    style={{ textTransform: 'none' }}
                  />
                  <Tab
                    value={1}
                    label={`${buyOrders.total_count || ''} Buy Orders`}
                    style={{ textTransform: 'none' }}
                  />
                </Tabs>
              </TableHeadCell>
            </TableRow>
          </TableHead>

          {tabIdx === 0 ? (
            <OfferList
              datatable={offers}
              loading={offerListLoading}
              error={error}
              onContact={handleContactClick}
              onRemove={handleRemoveClick}
              currentUserID={currentUserID}
              isMobile={isMobile}
            />
          ) : (
            <OrderList
              datatable={buyOrders}
              loading={buyOrderLoading}
              error={error}
              onContact={handleContactClick}
              onRemove={handleRemoveClick}
              currentUserID={currentUserID}
              isMobile={isMobile}
            />
          )}
        </Table>
      </TableContainer>

      {/* Only display pagination on offer list */}
      {tabIdx === 0 && pagination}

      {tabIdx === 1 && buyOrders.data.length !== 0 && buyOrders.total_count > 10 && (
        <Typography color="textSecondary" align="right" variant="body2" style={{ margin: 8 }}>
          {buyOrders.total_count - 10} more hidden buy orders at &nbsp;
          {amount(buyOrders.data[9].price || 0, 'USD')} or less
        </Typography>
      )}

      {/* Fixes bottom spacing */}
      {((tabIdx === 0 && offers.total_count === 0) ||
        (tabIdx === 1 && buyOrders.total_count <= 10)) && <div style={{ margin: 8 }}>&nbsp;</div>}

      <ContactDialog
        market={currentMarket}
        open={tabIdx === 0 && !!currentMarket}
        onClose={() => handleContactClick(null)}
      />

      <ContactBuyerDialog
        market={currentMarket}
        open={tabIdx === 1 && !!currentMarket}
        onClose={() => handleContactClick(null)}
      />
    </>
  )
}
MarketList.propTypes = {
  offers: PropTypes.object.isRequired,
  buyOrders: PropTypes.object.isRequired,
  pagination: PropTypes.element,
  error: PropTypes.string,
  loading: PropTypes.bool,
}
MarketList.defaultProps = {
  pagination: null,
  error: null,
  loading: false,
}

const OfferList = props => {
  const { isMobile } = props
  if (isMobile) {
    return <OfferListMini {...props} />
  }

  return <OfferListDesktop {...props} />
}
OfferList.propTypes = {
  isMobile: PropTypes.bool,
}
OfferList.defaultProps = {
  isMobile: false,
}

const OrderList = props => {
  const { isMobile } = props
  if (isMobile) {
    return <OrderListMini bidMode {...props} />
  }

  return <OrderListDesktop bidMode {...props} />
}
OrderList.propTypes = OfferList.propTypes
OrderList.defaultProps = OfferList.defaultProps

function baseTable(Component) {
  const wrapped = props => {
    const classes = useStyles()

    const { currentUserID, isMobile } = props

    const { onContact, onRemove } = props
    const handleContactClick = marketIdx => {
      onContact(marketIdx)
    }
    const handleRemoveClick = marketIdx => {
      onRemove(marketIdx)
    }

    const [currentIndex, setIndex] = React.useState(null)
    const [anchorEl, setAnchorEl] = React.useState(null)
    const debouncePopoverClose = debounce(() => {
      setAnchorEl(null)
      setIndex(null)
    }, 150)
    const handlePopoverOpen = event => {
      debouncePopoverClose.clear()
      setIndex(Number(event.currentTarget.dataset.index))
      setAnchorEl(event.currentTarget)
    }
    const handlePopoverClose = () => {
      setAnchorEl(null)
      setIndex(null)
    }
    const open = Boolean(anchorEl)
    const popoverElementID = open ? 'verified-status-popover' : undefined

    const { datatable, loading, error, bidMode } = props

    return (
      <>
        <TableBody style={{ opacity: loading ? 0.5 : 1 }}>
          <TableRow>
            <TableHeadCell size="small">
              <Typography color="textSecondary" variant="body2">
                {bidMode ? 'Buyer' : 'Seller'}
              </Typography>
            </TableHeadCell>
            <TableHeadCell size="small" align="right">
              <Typography color="textSecondary" variant="body2">
                {bidMode ? 'Buy Price' : 'Price'}
              </Typography>
            </TableHeadCell>
            {!isMobile && <TableHeadCell size="small" align="center" width={160} />}
          </TableRow>

          {error && (
            <TableRow>
              <TableCell align="center" colSpan={3}>
                Error retrieving data
                <br />
                <Typography variant="caption" color="textSecondary">
                  {error}
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {loading && (
            <TableRow>
              <TableCell align="center" colSpan={3}>
                Loading...
              </TableCell>
            </TableRow>
          )}

          {!error && datatable.total_count === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={3}>
                No available {bidMode ? 'orders' : 'offers'}
              </TableCell>
            </TableRow>
          )}

          {datatable.data.map((market, idx) => (
            <TableRow key={market.id} hover>
              <TableCell component="th" scope="row" padding="none">
                <Link href={`/profiles/${market.user.steam_id}`} disableUnderline>
                  <div className={classes.seller}>
                    <Avatar
                      className={classes.avatar}
                      alt={market.user.name}
                      {...retinaSrcSet(market.user.avatar, 40, 40)}
                    />
                    <div>
                      <strong>{market.user.name}</strong>
                      <br />
                      <Typography variant="caption" color="textSecondary">
                        {bidMode ? 'Ordered' : 'Posted'} {dateFromNow(market.created_at)}
                      </Typography>
                      <span
                        aria-owns={popoverElementID}
                        aria-haspopup="true"
                        data-index={idx}
                        onMouseLeave={debouncePopoverClose}
                        onMouseEnter={handlePopoverOpen}>
                        {VERIFIED_INVENTORY_MAP_ICON[market.inventory_status]}
                      </span>
                    </div>
                  </div>
                </Link>
              </TableCell>
              <Component
                currentUserID={currentUserID}
                market={market}
                onRemove={() => handleRemoveClick(idx)}
                onContact={() => handleContactClick(idx)}
              />
            </TableRow>
          ))}
        </TableBody>

        <VerifiedStatusPopover
          id={popoverElementID}
          open={open}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          onMouseEnter={() => debouncePopoverClose.clear()}
          market={datatable.data[currentIndex]}
        />
      </>
    )
  }
  wrapped.propTypes = {
    datatable: PropTypes.object.isRequired,
    error: PropTypes.string,
    loading: PropTypes.bool,
    currentUserID: PropTypes.string,
    isMobile: PropTypes.bool,
    onContact: PropTypes.func,
    onRemove: PropTypes.func,
    bidMode: PropTypes.bool,
  }
  wrapped.defaultProps = {
    error: null,
    loading: false,
    currentUserID: null,
    isMobile: false,
    onContact: () => {},
    onRemove: () => {},
    bidMode: false,
  }

  return wrapped
}

const OfferListDesktop = baseTable(({ market, currentUserID, onRemove, onContact }) => (
  <>
    <TableCell align="right">
      <Typography variant="body2">{amount(market.price, market.currency)}</Typography>
    </TableCell>
    <TableCell align="center">
      {currentUserID === market.user.id ? (
        // HOTFIX! wrapped button on div to prevent mixing up the styles(variant) of 2 buttons.
        <div>
          <Button variant="outlined" onClick={onRemove}>
            Remove
          </Button>
        </div>
      ) : (
        <BuyButton variant="contained" onClick={onContact}>
          Contact Seller
        </BuyButton>
      )}
    </TableCell>
  </>
))

const OfferListMini = baseTable(({ market, currentUserID, onRemove, onContact }) => (
  <TableCell
    align="right"
    style={{ cursor: 'pointer' }}
    onClick={currentUserID === market.user.id ? onRemove : onContact}>
    <Typography variant="body2">{amount(market.price, market.currency)}</Typography>
    <Typography
      variant="caption"
      color="textSecondary"
      style={{ color: currentUserID === market.user.id ? 'tomato' : '' }}>
      <u>{currentUserID === market.user.id ? 'Remove' : 'View'}</u>
    </Typography>
  </TableCell>
))

const OrderListDesktop = baseTable(({ market, currentUserID, onRemove, onContact }) => (
  <>
    <TableCell align="right">
      <Typography variant="body2">{amount(market.price, market.currency)}</Typography>
    </TableCell>
    <TableCell align="center">
      {currentUserID === market.user.id ? (
        // HOTFIX! wrapped button on div to prevent mixing up the styles(variant) of 2 buttons.
        <div>
          <Button variant="outlined" onClick={onRemove}>
            Remove
          </Button>
        </div>
      ) : (
        <SellButton
          // Check for redacted user and disable them for opening the dialog.
          disabled={!market.user.id}
          variant="contained"
          onClick={onContact}>
          {market.user.id ? `Contact Buyer` : `Sign in to view`}
        </SellButton>
      )}
    </TableCell>
  </>
))

const OrderListMini = baseTable(({ market, currentUserID, onRemove, onContact }) => (
  <TableCell
    align="right"
    onClick={() => {
      // Data was redacted, so we can do nothing about it.
      if (!market.user.id) {
        return
      }

      // Logged in user matched th data id, we can invoke remove callback.
      if (currentUserID === market.user.id) {
        onRemove()
        return
      }

      onContact()
    }}
    style={{ cursor: 'pointer' }}>
    <Typography variant="body2" style={{ color: bidColor.A200 }}>
      {amount(market.price, market.currency)}
    </Typography>

    {currentUserID === market.user.id ? (
      <Typography variant="caption" color="textSecondary" style={{ color: 'tomato' }}>
        <u>Remove</u>
      </Typography>
    ) : (
      <Typography variant="caption" color="textSecondary">
        <u>{market.user.id ? 'View' : 'Sign in to view'}</u>
      </Typography>
    )}
  </TableCell>
))
