import type { Metadata } from 'next';
import '../styles/globals.css';
import '../styles/pages.css';

export const metadata: Metadata = {
  title: 'ThemeKit — Motor Surveillance Dashboard',
  description: 'Tableau de bord de surveillance prédictive des moteurs industriels',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        {/* Icon Kit CDN */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
