import { useMemo, useState } from 'react'
import ErrorBoundary from '@/components/system/ErrorBoundary'
import ErrorPage from '@/pages/ErrorPage'
import HomePage from '@/pages/HomePage'
import LoadingPage from '@/pages/LoadingPage'

function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/'
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  const isNotFound = useMemo(() => {
    const path = normalizePath(window.location.pathname)
    return path !== '/' && path !== '/index.html'
  }, [])

  if (isLoading) {
    return <LoadingPage onContinue={() => setIsLoading(false)} />
  }

  if (isNotFound) {
    return (
      <ErrorPage
        code="404"
        title="Page Not Found"
        description="The route you opened does not exist in this portfolio app."
        primaryActionLabel="Go Home"
        primaryHref="/"
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white">
        <HomePage />
      </div>
    </ErrorBoundary>
  )
}

export default App
