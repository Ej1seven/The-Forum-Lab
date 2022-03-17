import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} from '../generated/graphql';
import { isServer } from '../utils/isServer';
import { useRouter } from 'next/router';

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
          <Link mr={2}>Login</Link>
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
    <Flex zIndex={1} bg="tan" p={4} position="sticky" top={0}>
      <Flex flex={1} m="auto" maxW={800} align="center">
        <NextLink href="/">
          <Link>
            <Heading>The Forum Finder</Heading>
          </Link>
        </NextLink>
        <Box ml={'auto'}>{body}</Box>
      </Flex>
    </Flex>
  );
};
