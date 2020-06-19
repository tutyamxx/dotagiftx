import Head from 'next/head'

export default function Version({ data }) {
  return (
    <div className="container">
      <Head>
        <title>version page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <p>Your viewing version page</p>
        <p>
          tag: {data.version} <br />
          hash: {data.hash} <br />
          built: {data.built} <br />
        </p>
      </main>
    </div>
  )
}

// This gets called on every request
export async function getServerSideProps() {
  // Fetch data from external API
  const res = await fetch(`https://fotolink.app/api/`)
  const data = await res.json()

  // Pass data to the page via props
  return { props: { data } }
}
