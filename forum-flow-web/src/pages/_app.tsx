//Chakra UI is a simple, modular and accessible component library that gives you the building blocks you need to build your React applications.
import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react';
//urql is a highly customizable and versatile GraphQL client

import theme from '../theme';

function MyApp({ Component, pageProps }: any) {
  return (
    //Provider allows the application to make use of the GraphQl client
    //ChakraProvider allows the application to make use of Chakra UI
    <ChakraProvider resetCSS theme={theme}>
      <ColorModeProvider
        options={{
          useSystemColorMode: true,
        }}
      >
        <Component {...pageProps} />
      </ColorModeProvider>
    </ChakraProvider>
  );
}

export default MyApp;
