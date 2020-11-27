import React from 'react'
import Head from 'next/head'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import { APP_NAME } from '@/constants/strings'
import Header from '@/components/Header'
import Container from '@/components/Container'
import Link from '@/components/Link'
import Footer from '@/components/Footer'

const useStyles = makeStyles(theme => ({
  main: {
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(2),
    },
    marginTop: theme.spacing(6),
  },
}))

function Question({ children }) {
  return (
    <Typography component="h2" gutterBottom style={{ fontWeight: 'bold' }}>
      {children}
    </Typography>
  )
}
function Answer({ children }) {
  return <Typography color="textSecondary">{children}</Typography>
}

export default function Faq() {
  const classes = useStyles()

  return (
    <>
      <Head>
        <title>{APP_NAME} :: Frequently Asked Questions</title>
      </Head>

      <Header />

      <main className={classes.main}>
        <Container>
          <Typography variant="h5" component="h1" gutterBottom>
            Frequently Asked Questions
          </Typography>
          <br />

          <Question>What is {APP_NAME}?</Question>
          <Answer>
            Market place for Dota 2 Giftables, items that can only be gift or gift-once are probably
            belong here. If you are on Dota2Trade subreddit, its basically the Giftable Megathread
            with a kick.
          </Answer>
          <br />

          <Question>What items I can find or post here?</Question>
          <Answer>
            Anything Dota 2 items that can be gift to a friend like set bundles from
            Collector&apos;s Cache, In-game drops, or Immortal treasures.
          </Answer>
          <br />

          <Question>Why do I need to sign in with Steam?</Question>
          <Answer>
            It verifies Steam account ownership and provides some helpful links to check your
            profile and reputation.
          </Answer>
          <br />

          <Question>Can I trust the users on this website?</Question>
          <Answer>
            Not really, but there are quick links like SteamRep and Steam on their profile to help
            you check them.
          </Answer>
          <br />

          <Question>Why do I need to wait 30 days to send the item?</Question>
          <Answer>
            Valve&apos;s rule that you need to have 30-day cooldown as friend to send giftable
            items.
          </Answer>
          <br />

          <Question>How do I report scammers?</Question>
          <Answer>
            You can use{' '}
            <Link
              href="https://steamrep.com/"
              target="_blank"
              color="secondary"
              rel="noreferrer noopener">
              SteamRep
            </Link>{' '}
            or inquire on{' '}
            <Link
              href="https://www.reddit.com/r/Dota2Trade/"
              target="_blank"
              color="secondary"
              rel="noreferrer noopener">
              r/Dota2Trade
            </Link>
            .
          </Answer>
          <br />

          <Question>Why do this?</Question>
          <Answer>
            Wanted to make tool that can be easily search and post these giftable items.
          </Answer>
          <br />
        </Container>
      </main>

      <Footer />
    </>
  )
}
