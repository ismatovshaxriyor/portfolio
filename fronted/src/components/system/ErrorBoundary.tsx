import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import ErrorPage from '@/pages/ErrorPage'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message?: string
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: undefined
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error boundary caught:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          code="500"
          title="Unexpected Runtime Error"
          description="An unexpected issue happened while rendering the app. Reload the page or return to home."
          details={this.state.message}
          primaryActionLabel="Reload Page"
          onPrimaryAction={this.handleReload}
          secondaryActionLabel="Go Home"
          secondaryHref="/"
        />
      )
    }

    return this.props.children
  }
}
