import { styled } from '@stitches/react';
import { URL } from '../../constants/configs';

const LogoWrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '-webkit-box-align': 'center',
  '-webkit-box-pack': 'center',
});

const InitialWrapper = styled('div', {
  width: '32px',
  height: '32px',
  color: '#FFFFFF',
  background: '#000000',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px',
  fontWeight: 700,
  cursor: 'default',
  '-webkit-box-align': 'center',
  '-webkit-box-pack': 'center',
});

const NameWrapper = styled('div', {
  fontWeight: 900,
  fontSize: '18px',
  letterSpacing: '0.5px',
  color: '#000000',
  cursor: 'default',
});

type LogoProps = {
  initial: string;
  name: string;
};

function Logo({ initial, name }: LogoProps) {
  return (
    <a href={URL}>
      <LogoWrapper>
        <InitialWrapper>{initial}</InitialWrapper>
        <NameWrapper>{name}</NameWrapper>
      </LogoWrapper>
    </a>
  );
}

export default Logo;
