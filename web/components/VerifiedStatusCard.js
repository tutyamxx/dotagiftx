import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Button from '@/components/Button'
import { LightTheme } from '@/components/Theme'
import {
  VERIFIED_INVENTORY_MAP_ICON,
  VERIFIED_INVENTORY_MAP_LABEL,
  VERIFIED_INVENTORY_MAP_TEXT,
} from '@/constants/verified'
import { dateCalendar, dateFromNow } from '@/lib/format'
import Link from '@/components/Link'

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: 300,
  },
  link: {},
  image: {},
}))

export default function VerifiedStatusCard({ market }) {
  const classes = useStyles()

  if (market === null) {
    return
  }

  const { inventory } = market

  const inventoryURL = 'https://steamcommunity.com/id/kudarap/inventory/#570_2'

  return (
    <CardX className={classes.root}>
      <CardContent>
        {inventory && (
          <>
            <Typography variant="h5" component="h2">
              {VERIFIED_INVENTORY_MAP_LABEL[inventory.status]}
            </Typography>
            <Typography color="textSecondary" variant="body2" component="p">
              Last updated {dateFromNow(inventory.updated_at)}
            </Typography>
            <Typography component="p">{VERIFIED_INVENTORY_MAP_TEXT[inventory.status]}</Typography>

            <br />
            <Typography variant="body2">Found {inventory.bundle_count} bundle/s</Typography>

            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Giftable</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.steam_assets.map(asset => (
                  <TableRow key={asset.name}>
                    <TableCell component="th" scope="row">
                      <Link
                        target="_blank"
                        rel="noreferrer noopener"
                        href={`${inventoryURL}_${asset.asset_id}`}>
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell align="center">{asset.gift_once ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
      <CardActions style={{ float: 'right' }}>
        <Link
          variant="caption"
          color="primary"
          target="_blank"
          rel="noreferrer noopener"
          href="https://steaminventory.org">
          Powered by <strong>SteamInventory.org</strong>
        </Link>
      </CardActions>
    </CardX>
  )
}

VerifiedStatusCard.propTypes = {}
VerifiedStatusCard.defaultProps = {}

function CardX(props) {
  return (
    <LightTheme>
      <Card {...props} />
    </LightTheme>
  )
}
