import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import dynamic from 'next/dynamic'
// import Theme from '@/components/Theme'
const Theme = dynamic(() => import('@/components/Theme'))

export default function MyApp(props) {
  const { Component, pageProps } = props

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    // eslint-disable-next-line no-undef
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  return (
    <>
      <Head>
        <title>DotagiftX - Dota 2 giftables market</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <Theme>
        <Component {...pageProps} />
      </Theme>
    </>
  )
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
}
