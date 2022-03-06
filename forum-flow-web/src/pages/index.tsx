import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { usePostsQuery } from '../generated/graphql';
import { Layout } from '../components/Layout';
import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useState } from 'react';

const Index = () => {
  //Pagination is used to page through the post
  //the limit variable is the amount of post shown per page
  //the cursor variable marks the last post on the current page
  //the server will use the cursor to determine if there are more post that need to be displayed
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as string | null,
  });
  //the usePostsQuery displays all the post
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });
  //if urql is not fetching data and the data returns false then the index page with display the text below
  if (!fetching && !data) {
    return <div>The query failed for some reason</div>;
  }
  //if urql is fetching the post then the page will display loading
  //otherwise we map through the post displaying the title, creator username, and text snippet for each post
  //if there are additional post that have not yet been displayed then the load more button will appear
  //otherwise once all the post are displayed the load more button disappears
  return (
    <Layout>
      <Flex align="center">
        <Heading>The Forum Finder</Heading>
        <NextLink href="create-post">
          <Link ml="auto">create post</Link>
        </NextLink>
      </Flex>

      <br />
      {fetching && !data ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Box p={5} key={p._id} shadow="md" borderWidth="1px">
              <Heading fontSize="xl">{p.title}</Heading>
              <Text>posted by {p.creator.username}</Text>
              <Text mt={4}>{p.textSnippet}</Text>
            </Box>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
            isLoading={fetching}
            m="auto"
            my={8}
          >
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
