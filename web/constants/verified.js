// Verified delivery and inventory

// import NoHitIcon from '@material-ui/icons/RemoveCircleOutline'
// import NoHitIcon from '@material-ui/icons/HighlightOff'
import NoHitIcon from '@material-ui/icons/Block'
import CheckIcon from '@material-ui/icons/Done'
import DoubleCheckIcon from '@material-ui/icons/DoneAll'
import Private from '@material-ui/icons/VisibilityOff'
// import Private from '@material-ui/icons/Block'
import Error from '@material-ui/icons/ErrorOutline'

const iconStyle = {
  style: {
    fontSize: '1rem',
    marginLeft: 4,
    marginRight: 2,
    marginBottom: -2,
    color: 'grey',
  },
}

const rareStyle = {
  style: { ...iconStyle.style, color: 'lightgreen' },
}

const ultraStyle = {
  style: { ...iconStyle.style, color: 'gold' },
}

export const VERIFIED_INVENTORY_NOHIT = 100
export const VERIFIED_INVENTORY_VERIFIED = 200
export const VERIFIED_INVENTORY_PRIVATE = 400
export const VERIFIED_INVENTORY_ERROR = 500

export const VERIFIED_INVENTORY_MAP_LABEL = {
  [VERIFIED_INVENTORY_NOHIT]: 'Not Found',
  [VERIFIED_INVENTORY_VERIFIED]: 'Item Verified',
  [VERIFIED_INVENTORY_PRIVATE]: 'Private Inventory',
  [VERIFIED_INVENTORY_ERROR]: 'Error',
}
export const VERIFIED_INVENTORY_MAP_TEXT = {
  [VERIFIED_INVENTORY_NOHIT]: "Item not found from seller's inventory",
  [VERIFIED_INVENTORY_VERIFIED]: "Item detected from seller's inventory",
  [VERIFIED_INVENTORY_PRIVATE]: "Seller's inventory is private",
  [VERIFIED_INVENTORY_ERROR]: 'Error processing verification',
}

export const VERIFIED_INVENTORY_MAP_ICON = {
  [VERIFIED_INVENTORY_NOHIT]: <NoHitIcon {...iconStyle} />,
  [VERIFIED_INVENTORY_VERIFIED]: <CheckIcon {...rareStyle} />,
  [VERIFIED_INVENTORY_PRIVATE]: <Private {...iconStyle} />,
  [VERIFIED_INVENTORY_ERROR]: <Error {...iconStyle} />,
}

const VERIFIED_DELIVERY_NOHIT = 100
const VERIFIED_DELIVERY_NAME_VERIFIED = 200
const VERIFIED_DELIVERY_SENDER_VERIFIED = 300
const VERIFIED_DELIVERY_PRIVATE = 400
const VERIFIED_DELIVERY_ERROR = 500

export const VERIFIED_DELIVERY_MAP_LABEL = {
  [VERIFIED_DELIVERY_NOHIT]: 'Not Found',
  [VERIFIED_DELIVERY_NAME_VERIFIED]: 'Item Verified',
  [VERIFIED_DELIVERY_SENDER_VERIFIED]: 'Sender Verified',
  [VERIFIED_DELIVERY_PRIVATE]: 'Private Inventory',
  [VERIFIED_DELIVERY_ERROR]: 'Error',
}
export const VERIFIED_DELIVERY_MAP_TEXT = {
  [VERIFIED_DELIVERY_NOHIT]: "Item not found from buyer's inventory",
  [VERIFIED_DELIVERY_NAME_VERIFIED]: "Item verified from buyer's inventory",
  [VERIFIED_DELIVERY_SENDER_VERIFIED]: "Sender avatar name matched the item from buyer's inventory",
  [VERIFIED_DELIVERY_PRIVATE]: "Buyer's inventory is private",
  [VERIFIED_DELIVERY_ERROR]: 'Error processing verification',
}

export const VERIFIED_DELIVERY_MAP_ICON = {
  [VERIFIED_DELIVERY_NOHIT]: <NoHitIcon {...iconStyle} />,
  [VERIFIED_DELIVERY_NAME_VERIFIED]: <CheckIcon {...rareStyle} />,
  [VERIFIED_DELIVERY_SENDER_VERIFIED]: <DoubleCheckIcon {...ultraStyle} />,
  [VERIFIED_DELIVERY_PRIVATE]: <Private {...iconStyle} />,
  [VERIFIED_DELIVERY_ERROR]: <Error {...iconStyle} />,
}
