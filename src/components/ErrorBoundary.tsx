import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CYTRACK Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-warm-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-warm-300 shadow-card text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-warm-900 font-semibold">Something went wrong</h2>
              <p className="text-sm text-warm-600">
                CYTRACK encountered an unexpected error. Your logged cycle data remains safe in storage.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-warm-50 rounded-xl border border-warm-200 text-left font-mono text-xs text-warm-700 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full min-h-touch py-3.5 px-6 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white font-medium flex items-center justify-center gap-2 shadow-soft transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reload CYTRACK
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
