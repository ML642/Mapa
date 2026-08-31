import { SITE_META } from '../config/env'

const DEFAULT_TITLE = 'Mapa — Events in Warsaw'
const DEFAULT_DESCRIPTION = SITE_META.DESCRIPTION
const DEFAULT_OG_IMAGE = `${SITE_META.SITE_URL}/mapa.svg`
const BASE_URL = SITE_META.SITE_URL

interface PageMeta {
  title?: string
  description?: string
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  canonical?: string
  noIndex?: boolean
}

const setMetaContent = (name: string, value: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    if (name.startsWith('og:')) {
      el.setAttribute('property', name)
    } else {
      el.setAttribute('name', name)
    }
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

const removeMeta = (name: string) => {
  const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)
  if (el) el.remove()
}

const setCanonical = (url: string) => {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export function applyPageMeta(meta: PageMeta) {
  const title = meta.title || DEFAULT_TITLE
  const description = meta.description || DEFAULT_DESCRIPTION
  const ogTitle = meta.ogTitle || title
  const ogDescription = meta.ogDescription || description
  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE
  const canonical = meta.canonical || new URL(window.location.pathname, `${BASE_URL}/`).href

  document.title = title
  setMetaContent('description', description)

  setMetaContent('og:title', ogTitle)
  setMetaContent('og:description', ogDescription)
  setMetaContent('og:image', ogImage)
  setMetaContent('og:url', canonical)
  setMetaContent('og:type', 'website')

  setMetaContent('twitter:title', ogTitle)
  setMetaContent('twitter:description', ogDescription)
  setMetaContent('twitter:image', ogImage)

  setCanonical(canonical)

  if (meta.noIndex) {
    setMetaContent('robots', 'noindex, nofollow')
  } else {
    removeMeta('robots')
  }
}

export { DEFAULT_TITLE, DEFAULT_DESCRIPTION, BASE_URL }
export type { PageMeta }
