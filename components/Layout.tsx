import { GithubFilled, LinkedinFilled, MailFilled } from '@ant-design/icons';
import { styled } from '@stitches/react';
import Script from 'next/script';
import Footer from './Footer';
import Header from './Header';
import {
  AUTHOR,
  EMAIL,
  GITHUB_USERNAME,
  GOOGLE_ANALYTICS,
  INITIAL,
  LINKEDIN_USERNAME,
  TITLE,
  URL,
} from '../constants/configs';
import Head from 'next/head';

type LayoutProps = {
  children: JSX.Element;
};

const Main = styled('main', {
  maxWidth: '768px',
  marginTop: '2rem',
  marginLeft: 'auto',
  marginRight: 'auto',
});

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Head>
        <meta property="og:image" content={`${URL}/thumbnail.png`} />
      </Head>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS}`}
      ></Script>
      <Script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GOOGLE_ANALYTICS}');
              `,
        }}
      />
      <Header
        initial={INITIAL}
        name={TITLE}
        contacts={[
          { icon: <GithubFilled />, url: `https://github.com/${GITHUB_USERNAME}` },
          {
            icon: <LinkedinFilled />,
            url: `https://linkedin.com/in/${LINKEDIN_USERNAME}`,
          },
          { icon: <MailFilled />, url: `mailto:${EMAIL}` },
        ]}
      />
      <Main>{children}</Main>
      <Footer year="2022" initial={INITIAL} name={AUTHOR} />
    </>
  );
}
