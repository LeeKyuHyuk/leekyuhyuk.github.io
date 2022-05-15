import { styled } from '@stitches/react';

const Excerpt = styled('p', {
  fontSize: '1.125rem',
  color: '#212529',
  transition: 'color 0.125s ease-in 0s;',
  lineHeight: 1.7,
  letterSpacing: '-0.004em',
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
});

export default Excerpt;
