//Chakra UI is a simple, modular and accessible component library that gives you the building blocks you need to build your React applications.
import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react';
import Head from 'next/head';
//urql is a highly customizable and versatile GraphQL client
import '../styles/globals.css';
import theme from '../theme';

//Provider allows the application to make use of the GraphQl client
//ChakraProvider allows the application to make use of Chakra UI
function MyApp({ Component, pageProps }: any) {
  return (
    <>
      <Head>
        <title>The Forum Lab</title>
      </Head>
      <ChakraProvider resetCSS theme={theme}>
        <ColorModeProvider
          options={{
            useSystemColorMode: true,
          }}
        >
          <Component {...pageProps} />
        </ColorModeProvider>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
