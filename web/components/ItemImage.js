import React from 'react'
import PropTypes from 'prop-types'
import { CDN_URL } from '@/service/api'
import { itemRarityColorMap } from '@/constants/palette'

const baseSizeQuality = 20
export function retinaSrcSet(filename, width, height) {
  if (!filename) {
    return { src: '' }
  }

  const src = `${CDN_URL}/${width + baseSizeQuality}x${height + baseSizeQuality}/${filename}`
  const src2x = `${CDN_URL}/${width * 2}x${height * 2}/${filename}`
  return { src, srcSet: `${src} 1x, ${src2x} 2x` }
}

export default function ItemImage({ image, title, rarity, className, width, height, ...other }) {
  const contStyle = {
    display: 'flex',
    lineHeight: 1,
    flexShrink: 0,
    overflow: 'hidden',
    userSelect: 'none',
  }

  if (rarity) {
    contStyle.border = `1px solid ${itemRarityColorMap[rarity]}`
  }

  const imgStyle = {
    color: 'transparent',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    textAlign: 'center',
    textIndent: '10000px',
  }

  let baseSrc = CDN_URL + image
  // using srcset to support high dpi or retina displays when
  // dimension were set.
  let srcSet = null
  if (width && height) {
    const rs = retinaSrcSet(image, width, height)
    baseSrc = rs.src
    srcSet = rs.srcSet
  }

  return (
    <div style={contStyle} className={className}>
      <img
        loading="lazy"
        src={baseSrc}
        srcSet={srcSet}
        alt={title || image}
        style={imgStyle}
        {...other}
      />
    </div>
  )
}
ItemImage.propTypes = {
  image: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  title: PropTypes.string,
  rarity: PropTypes.string,
  className: PropTypes.string,
}
ItemImage.defaultProps = {
  title: null,
  rarity: null,
  className: '',
}
