/**
 * Root Layout Component
 *
 * This is the root layout for the Map Route application.
 * It wraps all pages and provides:
 * - HTML structure
 * - Metadata configuration
 * - Global styles
 * - Mobile viewport configuration
 * - iOS-specific optimizations
 *
 * @module app/layout
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * Application metadata configuration
 * Used for SEO, social media sharing, and browser display
 */
export const metadata: Metadata = {
  title: 'Map Route - Business Location Tracker',
  description: 'Track and manage business locations on an interactive map with real-time Google Sheets synchronization.',
  applicationName: 'Map Route',
  authors: [{ name: 'Map Route Team' }],
  keywords: ['map', 'location', 'tracking', 'business', 'google maps', 'google sheets'],
  creator: 'Map Route Team',

  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Map Route',
    title: 'Map Route - Business Location Tracker',
    description: 'Track and manage business locations on an interactive map.',
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary',
    title: 'Map Route - Business Location Tracker',
    description: 'Track and manage business locations on an interactive map.',
  },

  // Robots configuration
  robots: {
    index: true,
    follow: true,
  },

  // Icons configuration
  icons: {
    icon: '/favicon.ico',
  },
};

/**
 * Viewport configuration for mobile optimization
 *
 * Key settings:
 * - width=device-width: Use device's native width
 * - initial-scale=1: Start at 100% zoom
 * - maximum-scale=1: Prevent user zoom (for app-like experience)
 * - user-scalable=no: Disable pinch-to-zoom (for app-like experience)
 * - viewport-fit=cover: Support iPhone notches and safe areas
 *
 * Note: Disabling zoom improves the app-like feel but may affect
 * accessibility. Consider allowing zoom if accessibility is prioritized.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4285F4', // Google Blue (matches primary color)
};

/**
 * Root layout props interface
 */
interface RootLayoutProps {
  /** Child components to render */
  children: React.ReactNode;
}

/**
 * Root Layout Component
 *
 * This component wraps all pages in the application.
 * It provides the HTML structure, metadata, and global styles.
 *
 * @param props - Component props
 * @returns Root layout JSX
 */
export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        {/*
          Additional meta tags for iOS Safari optimization
          These are not available in the Metadata API, so we add them here
        */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      </head>
      <body>
        {/* Main application content */}
        {children}
      </body>
    </html>
  );
}
