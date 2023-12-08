import '../styles/globals.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
const LayoutWithNoSSR = dynamic(() => import('../components/Layout'), { ssr: false });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LayoutWithNoSSR>
      <Component {...pageProps} />
    </LayoutWithNoSSR>
  );
}

export default MyApp;
