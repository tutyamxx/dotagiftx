import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import useSWR from 'swr'
import has from 'lodash/has'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import { APP_NAME } from '@/constants/strings'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Container from '@/components/Container'
import { fetcher, MARKETS, marketSearch, statsMarketSummary } from '@/service/api'
import MarketActivity from '@/components/MarketActivity'
import {
  MARKET_STATUS_MAP_TEXT,
  MARKET_STATUS_RESERVED,
  MARKET_STATUS_SOLD,
  MARKET_TYPE_ASK,
} from '@/constants/market'
import Link from '@/components/Link'

const useStyles = makeStyles(theme => ({
  main: {
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(2),
    },
    marginTop: theme.spacing(4),
  },
  profile: {
    float: 'left',
    marginRight: theme.spacing(1),
    width: 60,
    height: 60,
  },
  itemImage: {
    width: 60,
    height: 40,
    marginRight: 8,
    float: 'left',
  },
  nav: {
    display: 'flex',
    '& active[]': {
      color: 'white',
    },
    marginBottom: theme.spacing(2),
  },
}))

const defaultFilter = {
  type: MARKET_TYPE_ASK,
  sort: 'updated_at:desc',
  // limit: 100,
  page: 1,
}

const defaultData = {
  data: [],
  total_result: 0,
  total_total: 0,
}

const scrollBias = 300

export default function History({ status, summary, error }) {
  const classes = useStyles()

  const [datatable, setDatatable] = React.useState(defaultData)
  const [filter, setFilter] = React.useState({ ...defaultFilter, status })
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setDatatable(defaultData)
    setFilter({ ...defaultFilter, status })
  }, [status])

  React.useEffect(() => {
    if (loading) {
      return
    }

    setLoading(true)
    ;(async () => {
      try {
        const res = await marketSearch(filter)
        if (datatable.data.length === 0) {
          setDatatable(res)
        } else {
          const data = [...datatable.data, ...res.data]
          setDatatable({ ...datatable, data })
        }
      } catch (e) {
        console.log('error getting history', e.message)
      }
      setLoading(false)
    })()
  }, [filter])

  React.useEffect(() => {
    const listener = () => {
      const isLast = datatable.data.length === datatable.total_count
      if (loading || isLast || window.scrollY + scrollBias < window.scrollMaxY) {
        return
      }

      setFilter({ ...filter, page: filter.page + 1 })
    }

    window.addEventListener('scroll', listener)
    return () => {
      window.removeEventListener('scroll', listener)
    }
  })

  return (
    <>
      <Header />

      <Head>
        <title>
          {APP_NAME} :: Market {MARKET_STATUS_MAP_TEXT[status]} History
        </title>
        <meta name="description" content="Market transaction history" />
      </Head>

      <main className={classes.main}>
        <Container>
          <Typography variant="h5" component="h1">
            Market History
          </Typography>

          <Typography className={classes.nav}>
            <Typography
              component={Link}
              href="/history/reserved"
              style={status === MARKET_STATUS_RESERVED ? { textDecoration: 'underline' } : null}>
              {summary.reserved} Reserved
            </Typography>
            &nbsp;&middot;&nbsp;
            <Typography
              component={Link}
              href="/history/delivered"
              style={status === MARKET_STATUS_SOLD ? { textDecoration: 'underline' } : null}>
              {summary.sold} Delivered
            </Typography>
          </Typography>

          {error && <Typography color="error">{error.message.split(':')[0]}</Typography>}
          <MarketActivity datatable={datatable || {}} disablePrice={status !== null} />

          {loading && <Typography>Loading...</Typography>}
        </Container>
      </main>

      <Footer />
    </>
  )
}
History.propTypes = {
  status: PropTypes.number.isRequired,
  datatable: PropTypes.object.isRequired,
  error: PropTypes.string,
  summary: PropTypes.object.isRequired,
}
History.defaultProps = {
  error: null,
}

export async function getServerSideProps({ query }) {
  let status = null
  // eslint-disable-next-line default-case
  switch (query.status) {
    case 'reserved':
      status = MARKET_STATUS_RESERVED
      break
    case 'delivered':
      status = MARKET_STATUS_SOLD
      break
  }

  const summary = await statsMarketSummary()

  let datatable = {}
  let error = null
  try {
    datatable = await marketSearch({ ...defaultFilter, status })
  } catch (e) {
    error = e.message
  }

  return {
    props: { status, summary, datatable, error },
  }
}
