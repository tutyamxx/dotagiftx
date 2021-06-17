import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import useSWR from 'swr'
import Head from 'next/head'
import { useRouter } from 'next/router'
import has from 'lodash/has'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import MuiLink from '@material-ui/core/Link'
import { schemaOrgProduct } from '@/lib/richdata'
import {
  MARKET_STATUS_LIVE,
  MARKET_STATUS_RESERVED,
  MARKET_STATUS_SOLD,
  MARKET_TYPE_ASK,
  MARKET_TYPE_BID,
} from '@/constants/market'
import { itemRarityColorMap } from '@/constants/palette'
import { APP_NAME } from '@/constants/strings'
import {
  CDN_URL,
  fetcher,
  GRAPH_MARKET_SALES,
  MARKETS,
  marketSearch,
  trackItemViewURL,
} from '@/service/api'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Container from '@/components/Container'
import RarityTag from '@/components/RarityTag'
import MarketList from '@/components/MarketList'
import ItemImage from '@/components/ItemImage'
import Link from '@/components/Link'
import Button from '@/components/Button'
import TablePagination from '@/components/TablePagination'
import ChipLink from '@/components/ChipLink'
import AppContext from '@/components/AppContext'
import BidButton from '@/components/BidButton'
import BuyOrderDialog from '@/components/BuyOrderDialog'
import MarketSalesChart from '@/components/MarketSalesChart'
import MarketActivity from '@/components/MarketActivity'

const useStyles = makeStyles(theme => ({
  main: {
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1),
    },
    marginTop: theme.spacing(4),
  },
  details: {
    [theme.breakpoints.down('xs')]: {
      textAlign: 'center',
      display: 'block',
    },
    display: 'inline-flex',
  },
  title: {},
  media: {
    [theme.breakpoints.down('xs')]: {
      margin: '8px auto 8px !important',
      width: 300,
      height: 170,
    },
    width: 165,
    height: 110,
    marginRight: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  postItemButton: {
    [theme.breakpoints.down('xs')]: {
      margin: `8px auto !important`,
      width: '48%',
    },
    width: 165,
    marginRight: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    // height: 40,
  },
}))

const marketBuyOrderFilter = {
  type: MARKET_TYPE_BID,
  status: MARKET_STATUS_LIVE,
  sort: 'best',
  nocache: true,
}

const marketSalesGraphFilter = {
  type: MARKET_TYPE_ASK,
}

const marketReservedFilter = {
  type: MARKET_TYPE_ASK,
  status: MARKET_STATUS_RESERVED,
  sort: 'updated_at:desc',
}

const marketDeliveredFilter = {
  type: MARKET_TYPE_ASK,
  status: MARKET_STATUS_SOLD,
  sort: 'updated_at:desc',
}

const swrConfig = [
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnMount: true,
  },
]

const BUYORDER_QUERY_KEY = 'buyorder'

export default function ItemDetails({
  item,
  error: initialError,
  filter: initialFilter,
  initialAsks,
  initialBids,
  canonicalURL,
}) {
  const classes = useStyles()

  const { isMobile } = useContext(AppContext)

  if (initialError) {
    return (
      <>
        <Header />

        <main className={classes.main}>
          <Container>
            <Typography variant="h5" component="h1" gutterBottom align="center">
              Item Error
            </Typography>
            <Typography color="textSecondary" align="center">
              {initialError}
            </Typography>
          </Container>
        </main>

        <Footer />
      </>
    )
  }

  const [offers, setOffers] = React.useState(initialAsks)
  const [orders, setOrders] = React.useState(initialBids)
  const [error, setError] = React.useState(null)
  const [loading, setLoading] = React.useState(null)
  const [openBuyOrderDialog, setOpenBuyOrderDialog] = React.useState(false)
  const [tabIndex, setTabIndex] = React.useState(0)

  const router = useRouter()
  // Handle shallow route update for sort and page query
  const updateFilterRouter = f => {
    const { sort, page } = f
    const query = { sort, page }

    if (tabIndex === 1) {
      query.buyorder = ''
    } else {
      delete query.buyorder
    }

    router.push({ query }, null, { shallow: true })
  }
  // Set active tab on load
  React.useEffect(() => {
    if (has(router.query, BUYORDER_QUERY_KEY)) {
      setTabIndex(1)
    } else {
      setTabIndex(0)
    }
  }, [])

  // Handle offers data on load. when its available display immediately.
  React.useEffect(() => {
    setOffers(initialAsks)
  }, [initialAsks])

  // Handle filter changes
  const [filter, setFilter] = React.useState({ sort: initialFilter.sort, page: initialFilter.page })
  const handleFilterChange = (nextFilter, skipRouteUpdate = false) => {
    const f = { ...filter, ...nextFilter }
    setFilter(f)

    if (!skipRouteUpdate) {
      updateFilterRouter(f)
    }
  }
  const handleSortChange = sort => {
    handleFilterChange({ sort, page: 1 })
  }
  const handlePageChange = (e, page) => {
    handleFilterChange({ page })
    // Scroll to top
    window.scrollTo(0, 0)
  }
  const handleTabChange = idx => {
    setTabIndex(idx)
    const { slug } = router.query
    let { sort } = router.query
    if (!sort) {
      sort = 'best'
    }

    const query = {}
    if (sort) {
      query.sort = sort
    }

    if (idx === 0) {
      handleFilterChange({ sort, page: 1 }, true)
      let url = `${slug}`
      if (sort) {
        url += `?sort=${sort}`
      }

      router.push(url, null, { shallow: true })
      return
    }

    query.buyorder = ''
    router.push({ query }, null, { shallow: true })
  }

  const getOffers = async f => {
    setLoading('ask')
    try {
      const res = await marketSearch({ ...initialFilter, ...f })
      setOffers(res)
    } catch (e) {
      setError(e.message)
    }
    setLoading(null)
  }
  const getBuyOrders = async () => {
    // marketBuyOrderFilter.item_id = item.id
    // marketBuyOrderFilter.sort = filter.sort
    setLoading('bid')
    try {
      const res = await marketSearch({
        ...marketBuyOrderFilter,
        sort: filter.sort,
        item_id: item.id,
      })
      res.loaded = true
      setOrders(res)
    } catch (e) {
      setError(e.message)
    }
    setLoading(null)
  }
  const handleBuyOrderClick = () => {
    setOpenBuyOrderDialog(true)
  }
  const handleBuyerChange = () => {
    getBuyOrders()
  }

  // Handle initial buy orders on page load.
  React.useEffect(() => {
    getBuyOrders()
  }, [])

  // Handles update offers and buy orders on filter change
  React.useEffect(() => {
    // Check initial props is same and skip the fetch
    if (filter.sort === initialFilter.sort && filter.page === initialFilter.page) {
      setOffers(initialAsks)
      return
    }

    switch (tabIndex) {
      case 0:
        getOffers(filter)
        break
      case 1:
        getBuyOrders()
        break
      default:
      // no default
    }
  }, [filter.page, filter.sort, tabIndex])

  // Retrieve market sales graph.
  const shouldLoadGraph = Boolean(orders.loaded)
  marketSalesGraphFilter.item_id = item.id
  const { data: marketGraph, error: marketGraphError } = useSWR(
    shouldLoadGraph ? [GRAPH_MARKET_SALES, marketSalesGraphFilter] : null,
    ...swrConfig
  )

  // Retrieve market sale activity.
  const shouldLoadHistory = Boolean(marketGraph)
  marketReservedFilter.item_id = item.id
  const {
    data: marketReserved,
    error: marketReservedError,
    isValidating: marketReservedLoading,
  } = useSWR(shouldLoadHistory ? [MARKETS, marketReservedFilter] : null, ...swrConfig)

  marketDeliveredFilter.item_id = item.id
  const {
    data: marketDelivered,
    error: marketDeliveredError,
    isValidating: marketDeliveredLoading,
  } = useSWR(marketReserved ? [MARKETS, marketDeliveredFilter] : null, ...swrConfig)

  const metaTitle = `${APP_NAME} :: Listings for ${item.name}`
  const rarityText = item.rarity === 'regular' ? '' : ` — ${item.rarity.toString().toUpperCase()}`
  let metaDesc = `Buy ${item.name} from ${item.origin}${rarityText} item for ${item.hero}.`
  const jsonLD = schemaOrgProduct(canonicalURL, item, { description: metaDesc })
  if (item.lowest_ask) {
    const startingPrice = item.lowest_ask.toFixed(2)
    metaDesc += ` Price starting at $${startingPrice}`
  }

  const wikiLink = `https://dota2.gamepedia.com/${item.name.replace(/ +/gi, '_')}`

  let historyCount = false
  if (!marketReservedError && marketReserved) {
    historyCount = marketReserved.total_count
  }
  if (!marketDeliveredError && marketDelivered) {
    historyCount += marketDelivered.total_count
  }
  const isHistoryLoading = marketReservedLoading || marketDeliveredLoading

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonicalURL} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={`${CDN_URL}/${item.image}`} />
        <meta name="twitter:site" content={`${APP_NAME}`} />
        {/* OpenGraph */}
        <meta property="og:url" content={canonicalURL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={`${CDN_URL}/${item.image}`} />
        {/* Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLD) }}
        />
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          {!isMobile ? (
            <div className={classes.details}>
              {item.image && (
                <div>
                  <a href={wikiLink} target="_blank" rel="noreferrer noopener">
                    <ItemImage
                      className={classes.media}
                      image={item.image}
                      width={165}
                      height={110}
                      title={item.name}
                      rarity={item.rarity}
                    />
                  </a>
                  <Button
                    className={classes.postItemButton}
                    variant="outlined"
                    color="secondary"
                    component={Link}
                    href={`/post-item?s=${item.slug}`}
                    disableUnderline
                    fullWidth>
                    Post this item
                  </Button>
                </div>
              )}

              <Typography component="h1">
                <Typography component="p" variant="h4">
                  {item.name}
                </Typography>
                <Typography gutterBottom>
                  <Link href={`/search?origin=${item.origin}`}>{item.origin}</Link>{' '}
                  {item.rarity !== 'regular' && (
                    <>
                      &mdash;
                      <RarityTag
                        rarity={item.rarity}
                        variant="body1"
                        component={Link}
                        href={`/search?rarity=${item.rarity}`}
                      />
                    </>
                  )}
                  <br />
                  <Typography color="textSecondary" component="span">
                    {`Used by: `}
                  </Typography>
                  <Link href={`/search?hero=${item.hero}`}>{item.hero}</Link>
                  <br />
                  <ChipLink label="Dota 2 Wiki" href={wikiLink} />
                  &nbsp;&middot;&nbsp;
                  <Typography
                    variant="body2"
                    component={MuiLink}
                    color="textPrimary"
                    href="#reserved">
                    {item.reserved_count} Reserved
                  </Typography>
                  &nbsp;&middot;&nbsp;
                  <Typography
                    variant="body2"
                    component={MuiLink}
                    color="textPrimary"
                    href="#delivered">
                    {item.sold_count} Delivered
                  </Typography>
                  {/* <br /> */}
                  {/* <Typography color="textSecondary" component="span"> */}
                  {/*  {`Median Ask: `} */}
                  {/* </Typography> */}
                  {/* {item.median_ask.toFixed(2)} */}
                </Typography>
                <BidButton
                  onClick={handleBuyOrderClick}
                  className={classes.postItemButton}
                  style={{ marginTop: 1 }}
                  variant="outlined"
                  fullWidth>
                  Place buy order
                </BidButton>
              </Typography>
            </div>
          ) : (
            /* mobile screen */
            <div>
              <div style={{ background: 'rgba(0, 0, 0, 0.15)' }}>
                {item.image && (
                  <a href={wikiLink} target="_blank" rel="noreferrer noopener">
                    <ItemImage
                      className={classes.media}
                      image={item.image}
                      width={300}
                      height={170}
                      title={item.name}
                    />
                  </a>
                )}
              </div>

              <Typography
                noWrap
                component="h1"
                variant="h6"
                style={
                  item.rarity !== 'regular' ? { color: itemRarityColorMap[item.rarity] } : null
                }>
                {item.name}
              </Typography>
              <Typography>
                <Link href={`/search?hero=${item.hero}`}>{item.hero}</Link>
              </Typography>
              <Typography
                color="textSecondary"
                variant="body2"
                component={Link}
                href={`/search?origin=${item.origin}`}>
                {item.origin}
                {item.rarity !== 'regular' && (
                  <>
                    &nbsp;&middot;
                    <RarityTag
                      color="textSecondary"
                      variant="body2"
                      component={Link}
                      rarity={item.rarity}
                      href={`/search?rarity=${item.rarity}`}
                    />
                  </>
                )}
              </Typography>
              <div style={{ marginTop: 8 }}>
                <ChipLink label="Dota 2 Wiki" href={wikiLink} />
              </div>

              <br />
              <div align="center" style={{ display: 'flex', marginBottom: 2 }}>
                <Button
                  className={classes.postItemButton}
                  variant="outlined"
                  color="secondary"
                  component={Link}
                  href={`/post-item?s=${item.slug}`}
                  disableUnderline>
                  Post this item
                </Button>
                <BidButton
                  onClick={handleBuyOrderClick}
                  className={classes.postItemButton}
                  variant="outlined"
                  disableUnderline>
                  Place buy order
                </BidButton>
              </div>
            </div>
          )}

          <MarketList
            offers={offers}
            buyOrders={orders}
            error={error}
            loading={loading}
            onSortChange={handleSortChange}
            tabIndex={tabIndex}
            onTabChange={handleTabChange}
            sort={filter.sort}
            pagination={
              !error && (
                <TablePagination
                  onChangePage={handlePageChange}
                  style={{ textAlign: 'right' }}
                  count={offers.total_count || 0}
                  page={filter.page}
                />
              )
            }
          />

          {shouldLoadHistory && isHistoryLoading && <div>Loading {item.name} history...</div>}

          {shouldLoadHistory && !isHistoryLoading && (
            <div>
              <div>{item.name} history</div>
              {historyCount === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No history yet
                </Typography>
              )}

              {!marketGraphError && marketGraph && (
                <>
                  <br />
                  <MarketSalesChart data={marketGraph} />
                </>
              )}

              <div id="reserved">
                {marketReserved && marketReserved.result_count !== 0 && (
                  <MarketActivity datatable={marketReserved} disablePrice />
                )}
              </div>
              <div id="delivered">
                {marketDelivered && marketDelivered.result_count !== 0 && (
                  <MarketActivity datatable={marketDelivered} disablePrice />
                )}
              </div>
            </div>
          )}
        </Container>
        <BuyOrderDialog
          catalog={item}
          open={openBuyOrderDialog}
          onClose={() => {
            setOpenBuyOrderDialog(false)
          }}
          onChange={handleBuyerChange}
        />
        <img src={trackItemViewURL(item.id)} alt="" />
      </main>

      <Footer />
    </>
  )
}
ItemDetails.propTypes = {
  item: PropTypes.object.isRequired,
  canonicalURL: PropTypes.string.isRequired,
  filter: PropTypes.object,
  initialAsks: PropTypes.object,
  initialBids: PropTypes.object,
  error: PropTypes.string,
}
ItemDetails.defaultProps = {
  filter: {},
  initialAsks: {
    data: [],
  },
  initialBids: {
    data: [],
  },
  error: null,
}
