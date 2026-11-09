"use client";

import { Component, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { emptyIconTileClass, primaryButtonClass } from "./ui/styles";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div role="alert" className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <div className={emptyIconTileClass}>
              <TriangleAlert className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-[17px] font-semibold text-gray-900">문제가 생겼어요</h2>
            <p className="mt-1 text-[13px] text-gray-600">
              {this.state.error?.message || "잠시 후 다시 시도해 주세요"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className={`${primaryButtonClass} mt-6 h-10 px-5 text-[15px]`}
            >
              다시 시도
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
