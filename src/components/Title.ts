import React, { useEffect } from 'react'

export const Title: React.FC<{ children: string }> = ({ children: title }) => {
  useEffect(() => {
    const baseTitle = 'Kakeru'
    const compountTitle = /^\s*$/.test(title) ? baseTitle : `${title} - ${baseTitle}`
    document.title = compountTitle
  }, [title])
  return null
}
