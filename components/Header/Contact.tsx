import { styled } from '@stitches/react';
import ContactItem from '../../types/ContactItem';

const IconWrapper = styled('a', {
  fontSize: '28px',
  color: 'inherit',
  textDecoration: 'none',
  margin: '8px',
});

const ContactWrapper = styled('ul', {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '24px',
  color: 'rgb(134, 142, 150)',
  transition: 'all 0.3s ease 0s',
  '-webkit-box-pack': 'center',
  '-webkit-box-align': 'center',
});

type ContactProps = {
  items: ContactItem[];
};

function ContactIcon(item: ContactItem, index: number) {
  return (
    <li key={index}>
      <IconWrapper href={item.url}>{item.icon}</IconWrapper>
    </li>
  );
}

function Contact({ items }: ContactProps) {
  return <ContactWrapper>{items.map((item, index) => ContactIcon(item, index))}</ContactWrapper>;
}

export default Contact;
