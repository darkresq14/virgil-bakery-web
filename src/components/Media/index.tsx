import type React from 'react'
import { Fragment } from 'react'
import { ImageMedia } from './ImageMedia'
import { PdfMedia } from './PdfMedia'
import type { Props } from './types'
import { VideoMedia } from './VideoMedia'

export const Media: React.FC<Props> = (props) => {
  const { className, htmlElement = 'div', resource } = props

  const mimeType = typeof resource === 'object' ? resource?.mimeType : undefined
  const isVideo = mimeType?.includes('video')
  const isPdf = mimeType?.includes('pdf')
  const Tag = htmlElement || Fragment

  return (
    <Tag
      {...(htmlElement !== null
        ? {
            className,
          }
        : {})}
    >
      {isVideo ? (
        <VideoMedia {...props} />
      ) : isPdf ? (
        <PdfMedia {...props} />
      ) : (
        <ImageMedia {...props} />
      )}
    </Tag>
  )
}
