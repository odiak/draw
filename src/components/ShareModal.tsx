import { Dialog, DialogPanel, DialogTitle, Radio, RadioGroup, Textarea } from '@headlessui/react'
import classNames from 'classnames'
import { FC, useMemo, useState } from 'react'
import { baseUrl, imageBaseUrl } from '../constants'
import { withPrefix } from '../i18n/translate'
import { copyToClipboard } from '../utils/copyToClipboard'

const t = withPrefix('shareModal')

type Props = {
  isOpen: boolean
  onClose: () => void
  pictureId: string
}

type ImageFormat = 'none' | 'svg' | 'png'
type LinkFormat = 'direct' | 'markdown' | 'scrapbox'

export const ShareModal: FC<Props> = ({ isOpen, onClose, pictureId }) => {
  const [imageFormat, setImageFormat] = useState<ImageFormat>('svg')
  const [linkFormat, setLinkFormat] = useState<LinkFormat>('direct')
  const [transparent, setTransparent] = useState(false)
  const [scale, setScale] = useState(100)
  const [crop, setCrop] = useState(false)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [copiedLink, setCopiedLink] = useState(false)

  const pageLink = `${baseUrl}/${pictureId}`

  const imageLink = useMemo(() => {
    if (imageFormat === 'none') {
      return ''
    }

    let url = `${imageBaseUrl}/${pictureId}`
    if (!transparent) {
      url += '-opaque'
    }
    if (scale !== 100) {
      url += `-x${scale}`
    }
    if (crop) {
      url += `-w${width}-h${height}`
    }

    url += `.${imageFormat}`

    return url
  }, [crop, height, imageFormat, pictureId, scale, transparent, width])

  const linkText = useMemo(() => {
    if (imageFormat === 'none') return pageLink

    switch (linkFormat) {
      case 'direct':
        return imageLink
      case 'markdown':
        return `[![](${imageLink})](${pageLink})`
      case 'scrapbox':
        return `[${pageLink} ${imageLink}]`
    }
  }, [imageFormat, imageLink, linkFormat, pageLink])

  const handleCopyLink = () => {
    copyToClipboard(linkText)

    setCopiedLink(true)
    setTimeout(() => {
      setCopiedLink(false)
    }, 1000)
  }

  const handleDownload = () => {
    if (imageLink === '') return

    const a = document.createElement('a')
    a.href = `${imageLink}?dl=1`
    a.download = `kakeru-${imageLink.replace(/.*\//, '')}`
    a.click()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl relative">
          <DialogTitle className="text-2xl mb-4 font-bold">{t('title')}</DialogTitle>

          <button
            className="absolute top-2 right-4 text-3xl cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
          >
            &times;
          </button>

          <div className="space-y-4">
            {/* Image Format */}
            <div>
              <label className="block text-md font-medium mb-2">{t('format')}</label>
              <RadioGroup
                value={imageFormat}
                onChange={setImageFormat}
                className="flex space-x-2 flex-wrap space-y-2"
              >
                {(['none', 'png', 'svg'] as const).map((format) => (
                  <Radio key={format} value={format}>
                    {({ checked }) => (
                      <div
                        className={classNames(
                          'px-3 py-1 rounded cursor-default',
                          checked ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                        )}
                      >
                        {t(format)}
                      </div>
                    )}
                  </Radio>
                ))}
              </RadioGroup>
            </div>

            {/* Transparent */}
            {imageFormat !== 'none' && (
              <div>
                <label className="block text-md font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={() => setTransparent(!transparent)}
                    className="mr-2"
                  />
                  {t('transparent')}
                </label>
              </div>
            )}

            {/* Scale */}
            {imageFormat !== 'none' && (
              <div>
                <label className="block text-md font-medium mb-2">{t('scale')}</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-fit px-3 py-2 border rounded dark:bg-gray-700"
                >
                  <option value={50}>50%</option>
                  <option value={80}>80%</option>
                  <option value={100}>100%</option>
                  <option value={150}>150%</option>
                  <option value={200}>200%</option>
                </select>
              </div>
            )}

            {/* Crop */}
            {imageFormat !== 'none' && (
              <div>
                <label className="block text-md font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={crop}
                    onChange={() => setCrop(!crop)}
                    className="mr-2"
                  />
                  {t('setSize')}
                </label>
              </div>
            )}

            {/* Width and Height */}
            {imageFormat !== 'none' && crop && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-md font-medium mb-2">{t('width')}</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                    min={1}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('height')}</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                    min={1}
                    step={1}
                  />
                </div>
              </div>
            )}

            {/* Link Type */}
            {imageFormat !== 'none' && (
              <div>
                <label className="block text-md font-medium mb-2">{t('linkType')}</label>
                <div className="flex space-x-2">
                  <button
                    className={classNames(
                      'px-3 py-1 rounded',
                      linkFormat === 'direct'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                    onClick={() => setLinkFormat('direct')}
                  >
                    {t('direct')}
                  </button>
                  <button
                    className={classNames(
                      'px-3 py-1 rounded',
                      linkFormat === 'markdown'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                    onClick={() => setLinkFormat('markdown')}
                  >
                    Markdown
                  </button>
                  <button
                    className={classNames(
                      'px-3 py-1 rounded',
                      linkFormat === 'scrapbox'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                    onClick={() => setLinkFormat('scrapbox')}
                  >
                    Scrapbox
                  </button>
                </div>
              </div>
            )}

            {/* Link Preview */}
            <div>
              <label className="block text-md font-medium mb-2">{t('linkPreview')}</label>
              <Textarea
                readOnly
                className="w-full px-3 py-2 border rounded font-mono text-sm break-all border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                value={linkText}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 flex-wrap">
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleCopyLink}>
                {copiedLink ? t('copied') : t('copyLink')}
              </button>
              {imageFormat !== 'none' && (
                <>
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded"
                    onClick={handleDownload}
                  >
                    {t('download')}
                  </button>
                </>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
