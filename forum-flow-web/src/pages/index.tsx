import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { useState } from 'react';
import { EditDeletePostButtons } from '../components/EditDeletePostButtons';
import { Layout } from '../components/Layout';
//the UpdootSection represents the upvote/downvote arrows to the right of the post
//The UpdootSection also contains the current point value for that post
import { UpdootSection } from '../components/UpdootSection';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

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
  const [{ data, error, fetching }] = usePostsQuery({
    variables,
  });

  //if urql is not fetching data and the data returns false then the index page with display the text below
  if (!fetching && !data) {
    return (
      <div>
        <div>The query failed for some reason</div>
        <div>{error?.message}</div>
      </div>
    );
  }
  //if urql is fetching the post then the page will display loading
  //otherwise we map through the post displaying the title, creator username, and text snippet for each post
  //if there are additional post that have not yet been displayed then the load more button will appear
  //otherwise once all the post are displayed the load more button disappears
  return (
    <Layout>
      {fetching && !data ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) =>
            !p ? null : (
              <Flex p={5} key={p._id} shadow="md" borderWidth="1px">
                <UpdootSection post={p} />
                <Box flex={1}>
                  <NextLink href="/post/[id]" as={`/post/${p._id}`}>
                    <Link>
                      <Heading fontSize="xl">{p.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by {p.creator.username}</Text>
                  <Flex align="center">
                    <Text mt={4} flex={1}>
                      {p.textSnippet}
                    </Text>
                    <Box ml="auto">
                      <EditDeletePostButtons
                        creatorId={p.creator._id}
                        id={p._id}
                      />
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            )
          )}
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
