import Head from 'next/head'
import moment from 'moment'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Link from '@material-ui/core/Link'
import Typography from '@material-ui/core/Typography'
import { CDN_URL, user } from '@/service/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import UserMarketList from '@/components/UserMarketList'

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
  avatar: {
    [theme.breakpoints.down('xs')]: {
      margin: '0 auto',
    },
    width: 100,
    height: 100,
    marginRight: theme.spacing(1.5),
  },
}))

export default function UserDetails({ data }) {
  const classes = useStyles()

  const router = useRouter()
  const { id } = router.query

  return (
    <>
      <Head>
        <title>{data.name} store | Dota 2 Giftables</title>
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          <div className={classes.details}>
            <Avatar className={classes.avatar} src={CDN_URL + data.avatar} />
            <div>
              <Typography variant="h4">{data.name}</Typography>
              <Typography gutterBottom>
                <Typography color="textSecondary" component="span">
                  {`steam ID: `}
                </Typography>
                {data.steam_id}
                <br />

                <Typography color="textSecondary" component="span">
                  {`steam URL: `}
                </Typography>
                <Link href={data.url} color="secondary">
                  {data.url}
                </Link>
                <br />

                <Typography color="textSecondary" component="span">
                  {`registered: `}
                </Typography>
                {moment(data.created_at).fromNow()}
              </Typography>
            </div>
          </div>

          <UserMarketList />
        </Container>
      </main>

      <Footer />
    </>
  )
}

// This gets called on every request
export async function getServerSideProps({ params }) {
  const { id } = params
  const data = await user(String(id))
  // Pass data to the page via props
  return { props: { data } }
}
