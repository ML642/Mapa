import { useLocation } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { BASE_URL, type PageMeta } from '../lib/seo'

const PAGE_META: Record<string, PageMeta> = {
  '/login': { title: 'Log in — Mapa', description: 'Log in to Mapa to save events, add friends, and receive recommendations.', noIndex: true },
  '/register': { title: 'Sign up — Mapa', description: 'Sign up for Mapa to save events, add friends, and receive event recommendations in Warsaw.', noIndex: true },
  '/forgot-password': { title: 'Password recovery — Mapa', description: 'Regain access to your Mapa account.', noIndex: true },
  '/friends': { title: 'Friends — Mapa', noIndex: true },
  '/favorites': { title: 'Favorites — Mapa', noIndex: true },
  '/profile': { title: 'Profile — Mapa', noIndex: true },
  '/profile/my-friends': { title: 'My friends — Mapa', noIndex: true },
}

const PRIVATE_TABS = new Set(['friends', 'favorites', 'profile'])

export default function RoutePageMeta() {
  const { pathname, search } = useLocation()
  const tab = new URLSearchParams(search).get('tab')
  const isPublicHome = pathname === '/' && !tab
  const meta = PAGE_META[pathname] ?? { noIndex: !isPublicHome }
  const noIndex = meta.noIndex || (pathname === '/' && Boolean(tab)) || PRIVATE_TABS.has(tab ?? '')

  usePageMeta({
    ...meta,
    noIndex,
    canonical: new URL(pathname, `${BASE_URL}/`).href,
  })

  return null
}
