import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backgroundColor: "#1a1a2e",
          color: "white"
        }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#ff6b6b" }}>
            Something went wrong!
          </h1>
          <details style={{ 
            whiteSpace: "pre-wrap",
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "800px",
            width: "100%"
          }}>
            <summary style={{ cursor: "pointer", marginBottom: "10px" }}>
              Click to see error details
            </summary>
            <p style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <pre style={{ fontSize: "0.8rem", overflow: "auto" }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;