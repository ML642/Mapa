import { useEffect } from 'react'
import { applyPageMeta, type PageMeta } from '../lib/seo'

export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    applyPageMeta(meta)
  }, [
    meta.title,
    meta.description,
    meta.ogImage,
    meta.ogTitle,
    meta.ogDescription,
    meta.canonical,
    meta.noIndex,
  ])
}
