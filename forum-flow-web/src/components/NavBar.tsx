import { Box, Button, Flex, Heading, Link, Text } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} from '../generated/graphql';
import { isServer } from '../utils/isServer';
import { useRouter } from 'next/router';
import { MenuBtn } from './MenuBtn';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const router = useRouter();
  //The first index I renamed the fetching property to logoutFetching and it is used to display progress on the mutation - (not async)
  //the second index we named logout and it is meant to run after the mutation has completed. - (async)
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  //data and fetching properties are pulled from the MeQuery to determine if the the user is logged in or if the MeQuery is currently fetching data
  const [{ data, fetching }] = useMeQuery({
    //if the page is using server-side rendering then pause fetching data from the MeQuery
    pause: isServer(),
  });
  let body = null;
  // data is loading
  if (fetching) {
    //user not logged in
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={8}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>Register</Link>
        </NextLink>
      </>
    );
    //user is logged in
  } else {
    body = (
      <Flex align="center">
        <NextLink href="create-post">
          <Button as={Link} mr={4}>
            create post
          </Button>
        </NextLink>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          onClick={async () => {
            await logout();
            router.reload();
          }}
          variant="link"
          isLoading={logoutFetching}
        >
          logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex
      zIndex={1}
      bg="#004E7C"
      p={3}
      position="sticky"
      top={0}
      className="navigation"
    >
      <Flex flex={1} mx="5%" w="80%" align="center">
        <Box p="6px" bg="#dce1e3" w="250px" id="logo">
          <Box p=".4%" border="4px" borderColor="#b73225" bg="#004E7C">
            <NextLink href="/">
              <Link>
                <Heading size="lg">
                  <Text align="center" id="logo-text">
                    The Forum Lab
                  </Text>
                </Heading>
              </Link>
            </NextLink>
          </Box>
        </Box>
        <Box ml={'auto'} className="menuOptions">
          {body}
        </Box>
        <Box ml={'auto'} className="menuBtn">
          <MenuBtn data={data} fetching={fetching} logout={logout} />
        </Box>
      </Flex>
    </Flex>
  );
};
