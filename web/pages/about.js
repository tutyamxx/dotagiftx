import React from 'react'
import Head from 'next/head'
import { makeStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Typography from '@material-ui/core/Typography'
import Link from '@material-ui/core/Link'
import { APP_NAME } from '@/constants/strings'
import Header from '@/components/Header'
import Container from '@/components/Container'
import Footer from '@/components/Footer'

const useStyles = makeStyles(theme => ({
  main: {
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(2),
    },
    marginTop: theme.spacing(6),
    // background: 'url("/icon.png") no-repeat bottom right',
    // backgroundSize: 100,
  },
}))

export default function About() {
  const classes = useStyles()

  return (
    <>
      <Head>
        <title>{APP_NAME} :: About</title>
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          <Typography variant="h5" component="h1" gutterBottom>
            Who is behind this?
          </Typography>
          <br />
          <Avatar
            src="https://api.dotagiftx.com/images/adfb7fc8133861692abc5631d67b5f51dfd5753f.jpg"
            style={{ width: 100, height: 100 }}
          />
          <Typography color="textSecondary">
            <strong>kudarap</strong> &mdash; author
            <br />
            Feel free to contact me on{' '}
            <Link
              color="secondary"
              target="_blank"
              rel="noreferrer noopener"
              href="https://www.reddit.com/message/compose/?to=kudarap">
              Reddit
            </Link>{' '}
            or{' '}
            <Link
              color="secondary"
              target="_blank"
              rel="noreferrer noopener"
              href="https://discord.gg/UFt9Ny42kM">
              Discord
            </Link>{' '}
            if you have issues or suggestions.
          </Typography>
        </Container>
      </main>

      <Footer />
    </>
  )
}
