import moment from 'moment'

export function amount(n, currency = '') {
  let sign = ''
  if (currency) {
    // eslint-disable-next-line default-case
    switch (currency.toLocaleUpperCase()) {
      case 'USD':
        sign = '$'
        break
    }
  }

  return `${sign}${Number(n).toFixed(2)}`
}

export function numberWithCommas(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function dateFromNow(date) {
  const d = moment(date)
  const dc = d.clone()
  const now = moment()

  if (now < dc.add(1, 'day')) {
    return d.fromNow()
  }
  if (now < dc.add(1, 'month')) {
    // return `${((now.unix() - d.unix()) / 86400).toFixed()} days ago`
  }
  if (now < dc.add(1, 'year')) {
    return d.format('MMM DD')
  }
  return d.format('MMM DD, YYYY')
}

export function daysFromNow(date) {
  const d = moment(date)
  const dc = d.clone()
  const now = moment()

  if (now < dc.add(2, 'month') || now > dc.add(3, 'month')) {
    return `${((now.unix() - d.unix()) / 86400).toFixed()} days ago`
  }
  return d.fromNow()
}

export function dateCalendar(date) {
  return moment(date).format('MMMM DD, YYYY')
}

export function errorSimple(error) {
  if (!error) {
    return ''
  }

  return error.split(':')[0]
}
