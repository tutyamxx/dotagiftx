import React from 'react'
import PropTypes from 'prop-types'
import useSWR from 'swr'
import Head from 'next/head'
import Router from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'
import { CATALOGS, fetcher, marketSearch, catalogSearch } from '@/service/api'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Container from '@/components/Container'
import SearchInput from '@/components/SearchInput'
import CatalogList from '@/components/CatalogList'
import Link from '@/components/Link'

const useStyles = makeStyles(theme => ({
  main: {
    marginTop: theme.spacing(4),
  },
  searchBar: {
    margin: '0 auto',
    marginBottom: theme.spacing(4),
  },
  banner: {
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(0),
    },
    margin: theme.spacing(20, 0, 4, 0),
  },
  bannerText: {
    [theme.breakpoints.down('sm')]: {
      fontSize: 35,
    },
    fontWeight: 'bold',
    color: theme.palette.app.white,
  },
}))

const popularItemsFilter = {
  sort: 'popular-items',
  limit: 5,
}
const recentItemsFilter = {
  sort: 'recent-items',
  limit: 5,
}

export default function Index({ totalEntries, popularItems }) {
  const classes = useStyles()

  const { data: recentItems, recentError } = useSWR([CATALOGS, recentItemsFilter], fetcher)

  const handleSubmit = keyword => {
    Router.push(`/search?q=${keyword}`)
  }

  const description = `Search on ${totalEntries || ''} giftable listings`

  return (
    <>
      <Head>
        <title>Dota 2 Giftables</title>
        <meta name="description" content={description} />
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          <div className={classes.banner}>
            <Typography className={classes.bannerText} variant="h3" component="h1" align="center">
              {/* Search for Dota 2 <span style={{ display: 'inline-block' }}>Giftable items</span> */}
              {/* Buy & Sell */}
              Search for <span style={{ display: 'inline-block' }}>Dota 2 giftabe items</span>
            </Typography>
          </div>

          <SearchInput helperText={description} onSubmit={handleSubmit} />
          <br />

          <Typography>
            Popular Items
            <Link href="/search?sort=popular-items" color="secondary" style={{ float: 'right' }}>
              See All
            </Link>
          </Typography>
          {popularItems.error && <div>failed to load popular items: {popularItems.error}</div>}
          {!popularItems.error && <CatalogList items={popularItems.data} />}
          <br />

          <Typography>
            Recently Posted
            <Link href="/search?sort=recent-items" color="secondary" style={{ float: 'right' }}>
              See All
            </Link>
          </Typography>
          {recentError && <div>failed to load recent items</div>}
          {!recentItems && <LinearProgress color="secondary" />}
          {!recentError && recentItems && <CatalogList items={recentItems.data} variant="recent" />}
          <br />
        </Container>
      </main>

      <Footer />
    </>
  )
}
Index.propTypes = {
  totalEntries: PropTypes.string.isRequired,
  popularItems: PropTypes.object.isRequired,
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// This gets called on every request
export async function getServerSideProps() {
  const res = await marketSearch({ limit: 1 })
  const totalEntries = numberWithCommas(res.total_count || 0)

  let popularItems = { error: null }
  try {
    popularItems = await catalogSearch(popularItemsFilter)
  } catch (e) {
    popularItems.error = e
  }

  return {
    props: {
      totalEntries,
      popularItems,
      unstable_revalidate: 60,
    },
  }
}
