import { styled } from '@stitches/react';
import Logo from './Logo';

const FooterWrapper = styled('footer', {
  width: '100%',
  height: '300px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  '-webkit-box-align': 'center',
  '-webkit-box-pack': 'center',
});

const Year = styled('div', {
  color: 'rgb(206, 212, 218)',
  marginBottom: '8px',
  fontSize: '22px',
  fontWeight: 700,
});

type FooterProps = {
  year: string;
  initial: string;
  name: string;
};

function Footer({ year, initial, name }: FooterProps) {
  return (
    <FooterWrapper>
      <Year>© {year}</Year>
      <Logo initial={initial} name={name} />
    </FooterWrapper>
  );
}

export default Footer;
