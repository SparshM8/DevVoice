"use client";

import React, { ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("DevVoice error boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="glass rounded-2xl p-6">
            <p className="font-semibold text-red-300">Something went wrong</p>
            <p className="mt-2 text-sm text-slate-300">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
