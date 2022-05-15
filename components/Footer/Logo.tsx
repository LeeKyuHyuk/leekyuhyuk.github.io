import { styled } from '@stitches/react';

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
  background: 'rgb(206, 212, 218)',
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
  color: 'rgb(206, 212, 218)',
  cursor: 'default',
  textTransform: 'uppercase',
});

type LogoProps = {
  initial: string;
  name: string;
};

function Logo({ initial, name }: LogoProps) {
  return (
    <LogoWrapper>
      <InitialWrapper>{initial}</InitialWrapper>
      <NameWrapper>{name}</NameWrapper>
    </LogoWrapper>
  );
}

export default Logo;
