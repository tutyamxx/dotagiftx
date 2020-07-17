import React from 'react'
import PropTypes from 'prop-types'
import useSWR from 'swr'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import { MARKET_STATUS_LIVE } from '@/constants/market'
import { catalog, marketSearch, trackViewURL, MARKETS, fetcher } from '@/service/api'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Container from '@/components/Container'
import RarityTag from '@/components/RarityTag'
import MarketList from '@/components/MarketList'
import ItemImage from '@/components/ItemImage'
import Link from '@/components/Link'
import TablePagination from '@/components/TablePagination'
import { fetcher as fetcher2, parseQuery } from '@/service/fetcher'

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
  media: {
    [theme.breakpoints.down('xs')]: {
      margin: '0 auto !important',
    },
    width: 150,
    height: 100,
    marginRight: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
}))

const marketSearchFilter = { status: MARKET_STATUS_LIVE, sort: 'price', page: 1 }

export default function ItemDetails({ item, markets }) {
  const classes = useStyles()

  const router = useRouter()

  marketSearchFilter.item_id = item.id
  if (router.query.page) {
    marketSearchFilter.page = router.query.page
  }
  const [filter, setFilter] = React.useState(marketSearchFilter)

  const url = parseQuery(MARKETS, filter)
  console.log('filter', url)

  const { data: marketListing, error: marketError } = useSWR(url, fetcher2, {
    initialData: markets,
  })
  React.useEffect(() => {
    setFilter({ ...filter, ...router.query })
  }, [router.query])

  const handlePageChange = (e, page) => {
    router.push(`/item/[slug]`, `/item/${item.slug}?page=${page}`)
    setFilter({ ...filter, page })
  }

  return (
    <>
      <Head>
        <title>
          Dota 2 Giftables :: Listings for {item.name} :: Price starts at ${item.lowest_ask}
        </title>
        <meta
          name="description"
          content={`Buy ${item.name} from ${
            item.origin
          } ${item.rarity.toString().toUpperCase()} for ${item.hero}. Price start at ${
            item.lowest_ask
          }`}
        />
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          <div className={classes.details}>
            {item.image && (
              <ItemImage
                className={classes.media}
                image={`${item.image}/300x170`}
                title={item.name}
                rarity={item.rarity}
              />
            )}
            <Typography component="h1">
              <Typography component="p" variant="h4">
                {item.name}
              </Typography>
              <Typography gutterBottom>
                <Link href={`/search?q=${item.origin}`}>{item.origin}</Link>{' '}
                {item.rarity !== 'regular' && (
                  <>
                    &mdash;
                    <RarityTag rarity={item.rarity} variant="body1" component="span" />
                  </>
                )}
                <br />
                <Typography color="textSecondary" component="span">
                  {`Used by: `}
                </Typography>
                <Link href={`/search?q=${item.hero}`}>{item.hero}</Link>
              </Typography>
            </Typography>
          </div>

          <MarketList data={marketListing} error={marketError} />
          <TablePagination
            style={{ textAlign: 'right' }}
            count={marketListing.total_count}
            page={Number(filter.page)}
            onChangePage={handlePageChange}
          />
        </Container>

        <img src={trackViewURL(item.id)} alt="" />
      </main>

      <Footer />
    </>
  )
}
ItemDetails.propTypes = {
  item: PropTypes.object.isRequired,
  markets: PropTypes.object,
}
ItemDetails.defaultProps = {
  markets: {
    data: [],
  },
}

// This gets called on every request
export async function getServerSideProps({ params, query }) {
  const item = await catalog(params.slug)

  marketSearchFilter.item_id = item.id
  if (query.page) {
    marketSearchFilter.page = Number(query.page)
  }

  return {
    props: {
      item,
      markets: await marketSearch(marketSearchFilter),
    },
  }
}

// export async function getStaticPaths() {
//   const catalogs = await catalogSearch({ limit: 1000, sort: 'popular-items' })
//   const paths = catalogs.data.map(({ slug }) => ({
//     params: { slug },
//   }))
//
//   return { paths, fallback: true }
// }
