import React from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import Link from '@/components/Link'
import RarityTag from '@/components/RarityTag'
import TableHeadCell from '@/components/TableHeadCell'
import ItemImage from '@/components/ItemImage'

const useStyles = makeStyles(theme => ({
  th: {
    cursor: 'pointer',
  },
  pagination: {
    textAlign: 'right',
  },
  link: {
    [theme.breakpoints.down('xs')]: {
      paddingLeft: theme.spacing(2),
    },
    padding: theme.spacing(2, 2, 2, 0),
    display: 'flex',
  },
  image: {
    margin: theme.spacing(-1, 1, -1, 1),
    width: 77,
    height: 55,
  },
}))

export default function CatalogList({ items = [], variant }) {
  const classes = useStyles()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'))

  const isRecentMode = variant === 'recent'

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="items table">
        <TableHead>
          <TableRow>
            <TableHeadCell>Item</TableHeadCell>
            <TableHeadCell align="right">{isRecentMode ? 'Listed' : 'Qty'}</TableHeadCell>
            <TableHeadCell align="right">Price</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={3}>
                No Result
              </TableCell>
            </TableRow>
          )}

          {items.map(item => (
            <TableRow key={item.id} hover>
              <TableCell className={classes.th} component="th" scope="row" padding="none">
                <Link
                  className={classes.link}
                  href="/item/[slug]"
                  as={`/item/${item.slug}`}
                  disableUnderline>
                  {!isMobile && (
                    <ItemImage
                      className={classes.image}
                      image={`${item.image}/200x100`}
                      title={item.name}
                      rarity={item.rarity}
                    />
                  )}

                  <div>
                    <strong>{item.name}</strong>
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {item.hero}
                    </Typography>
                    <RarityTag rarity={item.rarity} />
                  </div>
                </Link>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2" color="textSecondary">
                  {isRecentMode ? moment(item.recent_ask).fromNow() : item.quantity}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2">${item.lowest_ask.toFixed(2)}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
CatalogList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  variant: PropTypes.string,
}
CatalogList.defaultProps = {
  variant: '',
}
