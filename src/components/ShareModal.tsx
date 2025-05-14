import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { FC, useState } from 'react'
import { withPrefix } from '../i18n/translate'
import { baseUrl, imageBaseUrl } from '../constants'
import { copyToClipboard } from '../utils/copyToClipboard'
import classNames from 'classnames'

const t = withPrefix('shareModal')

type Props = {
  isOpen: boolean
  onClose: () => void
  pictureId?: string
}

type Format = 'svg' | 'png'
type LinkType = 'direct' | 'markdown' | 'scrapbox'

export const ShareModal: FC<Props> = ({ isOpen, onClose, pictureId }) => {
  const [format, setFormat] = useState<Format>('svg')
  const [linkType, setLinkType] = useState<LinkType>('direct')
  const [opacity, setOpacity] = useState(100)
  const [scale, setScale] = useState(100)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)

  if (!pictureId) return null

  const imageLink = `${imageBaseUrl}/${pictureId}.${format}`
  const pageLink = `${baseUrl}/${pictureId}`

  const getLinkText = () => {
    switch (linkType) {
      case 'direct':
        return imageLink
      case 'markdown':
        return `[![](${imageLink})](${pageLink})`
      case 'scrapbox':
        return `[${pageLink} ${imageLink}]`
    }
  }

  const handleCopyLink = () => {
    copyToClipboard(getLinkText())
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = imageLink
    a.download = `kakeru-${pictureId}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded bg-white dark:bg-gray-800 p-6 shadow-xl">
          <DialogTitle className="text-lg font-medium mb-4">{t('title')}</DialogTitle>
          
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('format')}</label>
              <div className="flex space-x-2">
                <button
                  className={classNames(
                    'px-3 py-1 rounded',
                    format === 'svg'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  onClick={() => setFormat('svg')}
                >
                  SVG
                </button>
                <button
                  className={classNames(
                    'px-3 py-1 rounded',
                    format === 'png'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  onClick={() => setFormat('png')}
                >
                  PNG
                </button>
              </div>
            </div>

            {/* Link Type */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('linkType')}</label>
              <div className="flex space-x-2">
                <button
                  className={classNames(
                    'px-3 py-1 rounded',
                    linkType === 'direct'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  onClick={() => setLinkType('direct')}
                >
                  {t('direct')}
                </button>
                <button
                  className={classNames(
                    'px-3 py-1 rounded',
                    linkType === 'markdown'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  onClick={() => setLinkType('markdown')}
                >
                  Markdown
                </button>
                <button
                  className={classNames(
                    'px-3 py-1 rounded',
                    linkType === 'scrapbox'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  onClick={() => setLinkType('scrapbox')}
                >
                  Scrapbox
                </button>
              </div>
            </div>

            {/* Opacity Slider */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('opacity')}: {opacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Scale Slider */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('scale')}: {scale}%
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Width and Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('width')}</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('height')}</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Link Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('linkPreview')}</label>
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                <code className="text-sm">{getLinkText()}</code>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                onClick={onClose}
              >
                {t('cancel')}
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleCopyLink}
              >
                {t('copyLink')}
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded"
                onClick={handleDownload}
              >
                {t('download')}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
