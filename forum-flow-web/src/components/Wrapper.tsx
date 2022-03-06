import { Box } from '@chakra-ui/react';
import React from 'react';

export type WrapperVariant = 'small' | 'regular';
interface wrapperProps {
  variant?: WrapperVariant;
}
//Wraps a component in a box
export const Wrapper: React.FC<wrapperProps> = ({
  children,
  variant = 'regular',
}) => {
  return (
    //Box is the most abstract component on top of which all other Chakra UI components are built. By default, it renders a div element.
    <Box
      mt={8}
      mx="auto"
      maxW={variant === 'regular' ? '800px' : '400px'}
      w="100%"
    >
      {children}
    </Box>
  );
};
