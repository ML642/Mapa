import { useEffect, useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Desktop from './components/Desktop'
import Mobile from './components/Mobile'
import { FavoriteProvider } from './components/Desktop/contexts/FavoriteContext'
import './text.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { bootstrapSession } from './services';
import { AuthModalProvider } from './components/Desktop/contexts/AuthModalContext';
import { AddFriendsModalProvider } from './components/Desktop/contexts/AddFriendsContext'
import { ShareEventProvider } from './components/Desktop/contexts/ShareEventContext';
import { GOOGLE_CONFIG } from './config/env';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/providers/queryProvider'
import LoadingSpinner from './components/Common/LoadingSpinner'
import { useIsMobile } from './hooks/useResponsiveLayout'
import RoutePageMeta from './components/RoutePageMeta'
import { CookieConsentBanner } from './components/Cookie/CookieConsentBanner'

function App() {
  const isMobile = useIsMobile()
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    void bootstrapSession().finally(() => setBootstrapping(false))
  }, [])

  if (bootstrapping) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-surface-page)]">
        <LoadingSpinner size={52} />
      </div>
    )
  }

  return (
    <Router>
      <RoutePageMeta />
      <GoogleOAuthProvider clientId={GOOGLE_CONFIG.CLIENT_ID}>
        <AuthModalProvider>
          <ShareEventProvider>
            <AddFriendsModalProvider>
              <FavoriteProvider>
                <QueryClientProvider client={queryClient}>
                  {isMobile ? <Mobile /> : <Desktop />}
                  <CookieConsentBanner />
                </QueryClientProvider>
              </FavoriteProvider>
            </AddFriendsModalProvider>
          </ShareEventProvider>
        </AuthModalProvider>
      </GoogleOAuthProvider>
    </Router>
  )
}

export default App
