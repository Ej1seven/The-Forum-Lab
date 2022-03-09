import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import React, { useState } from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

interface UpdootSectionProps {
  post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  //the loadingState allows the component to tell if the updoot or downdoot arrows are loading when clicked
  const [loadingState, setLoadingState] = useState<
    'updoot-loading' | 'downdoot-loading' | 'not-loading'
  >('not-loading');
  //the voteMutation() either adds or subtracts points to the post
  const [, vote] = useVoteMutation();
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        aria-label="updoot post"
        icon={<ChevronUpIcon boxSize={8} />}
        onClick={async () => {
          //if the end user clicks on the updoot arrow twice then the value remains the same and does not add another point
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState('updoot-loading');
          //finds the selected post by matching the post._id and adds 1 point
          await vote({
            postId: post._id,
            value: 1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'updoot-loading'}
        //the updoot arrow turns green once selected
        color={post.voteStatus === 1 ? 'green' : undefined}
      />
      {post.points}

      <IconButton
        aria-label="downdoot post"
        icon={<ChevronDownIcon boxSize={8} />}
        onClick={async () => {
          //if the end user clicks on the downdoot arrow twice then the value remains the same and does not subtract another point
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState('downdoot-loading');
          //finds the selected post by matching the post._id and subtracts 1 point
          await vote({
            postId: post._id,
            value: -1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'downdoot-loading'}
        //the downdoot arrow turns red once selected
        color={post.voteStatus === -1 ? 'red' : undefined}
      />
    </Flex>
  );
};
