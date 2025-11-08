"use client";

import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Critical application error:", error);
	}, [error]);

	return (
		<html lang="en">
			<head>
				<title>Critical Error | Fictures</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body>
				{/* Inline styles since we can't use external CSS in global-error */}
				<style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }

          .error-container {
            max-width: 600px;
            width: 100%;
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem 2rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .error-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s ease-in-out infinite;
          }

          .error-icon svg {
            width: 60px;
            height: 60px;
            color: #ffffff;
          }

          h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          p {
            font-size: 1.125rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            opacity: 0.9;
          }

          .button-group {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }

          @media (min-width: 640px) {
            .button-group {
              flex-direction: row;
              justify-content: center;
            }
          }

          button, a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.875rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            min-width: 160px;
          }

          .primary-button {
            background: #ffffff;
            color: #667eea;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .primary-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          }

          .primary-button:active {
            transform: translateY(0);
          }

          .secondary-button {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            border: 2px solid rgba(255, 255, 255, 0.3);
          }

          .secondary-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }

          .secondary-button:active {
            transform: translateY(0);
          }

          .error-details {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            text-align: left;
            font-size: 0.875rem;
            max-height: 200px;
            overflow: auto;
          }

          .error-details summary {
            cursor: pointer;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .error-details pre {
            white-space: pre-wrap;
            word-break: break-word;
            opacity: 0.8;
            font-family: monospace;
            font-size: 0.75rem;
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.8;
            }
          }

          .decorative-circle {
            position: fixed;
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
          }

          .circle-1 {
            width: 300px;
            height: 300px;
            background: rgba(255, 255, 255, 0.1);
            top: -100px;
            right: -100px;
            animation: float 6s ease-in-out infinite;
          }

          .circle-2 {
            width: 400px;
            height: 400px;
            background: rgba(255, 255, 255, 0.05);
            bottom: -150px;
            left: -150px;
            animation: float 8s ease-in-out infinite reverse;
          }

          @keyframes float {
            0%, 100% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(30px, -30px);
            }
          }
        `}</style>

				<div className="error-container">
					{/* Error Icon */}
					<div className="error-icon">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>

					{/* Error Message */}
					<h1>Critical System Error</h1>
					<p>
						We&apos;ve encountered a critical error that affected the entire
						application. This is unusual and our team has been notified. Please
						try restarting the application.
					</p>

					{/* Action Buttons */}
					<div className="button-group">
						<button onClick={reset} className="primary-button">
							<svg
								width="20"
								height="20"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Restart Application
						</button>

						<a href="/" className="secondary-button">
							<svg
								width="20"
								height="20"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
							Return Home
						</a>
					</div>

					{/* Error Details (Development Only) */}
					{process.env.NODE_ENV === "development" && (
						<details className="error-details">
							<summary>Technical Details (Development Only)</summary>
							<pre>
								{error.message}
								{error.digest && `\n\nError ID: ${error.digest}`}
							</pre>
						</details>
					)}
				</div>

				{/* Decorative Background Elements */}
				<div className="decorative-circle circle-1" />
				<div className="decorative-circle circle-2" />
			</body>
		</html>
	);
}
