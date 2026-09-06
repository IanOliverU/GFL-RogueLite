import { Component, type ReactNode } from 'react'

export class RenderErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div className="graphics-error" role="alert">The 3D view could not start. Enable WebGL in your browser, then reload this page. <button onClick={() => window.location.reload()}>Reload</button></div>
    return this.props.children
  }
}
