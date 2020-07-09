import React from 'react'
import PropTypes from 'prop-types'
import useSWR from 'swr'
import Head from 'next/head'
import Router from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'
import { CATALOGS, fetcher, marketSearch } from '@/service/api'
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
  sort: 'view_count:desc',
  limit: 5,
}
const recentItemsFilter = {
  sort: 'recent_ask:desc',
  limit: 5,
}

export default function Index({ totalEntries }) {
  const classes = useStyles()

  const { data: popularItems, popularError } = useSWR([CATALOGS, popularItemsFilter], fetcher)
  const { data: recentItems, recentError } = useSWR([CATALOGS, recentItemsFilter], fetcher)

  const handleSubmit = keyword => {
    Router.push(`/search?q=${keyword}`)
  }

  const description = `Search on ${totalEntries || ''} for Dota 2 Giftables items`

  return (
    <>
      <Head>
        <title>Dota 2 Giftables :: {description}</title>
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          <div className={classes.banner}>
            <Typography className={classes.bannerText} variant="h3" component="h1" align="center">
              Search for Dota 2 <span style={{ display: 'inline-block' }}>Giftable items</span>
            </Typography>
          </div>

          <SearchInput helperText={description} onSubmit={handleSubmit} />
          <br />

          <Typography>
            Popular Items
            <Link
              href={`/search?sort=${popularItemsFilter.sort}`}
              color="secondary"
              style={{ float: 'right' }}>
              See All
            </Link>
          </Typography>
          {popularError && <div>failed to load</div>}
          {!popularItems && <LinearProgress color="secondary" />}
          {!popularError && popularItems && <CatalogList items={popularItems.data} />}
          <br />

          <Typography>
            Recently Posted
            <Link
              href={`/search?sort=${recentItemsFilter.sort}`}
              color="secondary"
              style={{ float: 'right' }}>
              See All
            </Link>
          </Typography>
          {recentError && <div>failed to load</div>}
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
  totalEntries: PropTypes.number.isRequired,
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// This gets called on every request
export async function getServerSideProps() {
  const res = await marketSearch({ limit: 1 })
  const totalEntries = numberWithCommas(res.total_count || 0)
  return { props: { totalEntries } }
}
