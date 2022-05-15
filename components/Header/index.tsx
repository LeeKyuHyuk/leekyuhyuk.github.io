import { styled } from '@stitches/react';
import ContactItem from '../../types/ContactItem';
import Contact from './Contact';
import Logo from './Logo';

const HeaderWrapper = styled('header', {
  display: 'flex',
  alignItems: 'center',
  background: '#FFFFFF',
  height: '60px',
  justifyContent: 'space-between',
  '-webkit-box-align': 'center',
  '-webkit-box-pack': 'justify',
});

type HeaderProps = {
  initial: string;
  name: string;
  contacts: ContactItem[];
};

function Header({ initial, name, contacts }: HeaderProps) {
  return (
    <HeaderWrapper>
      <Logo initial={initial} name={name} />
      <Contact items={contacts} />
    </HeaderWrapper>
  );
}

export default Header;
