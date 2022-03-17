import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import { InputField } from '../../../components/InputField';
import { Layout } from '../../../components/Layout';
import {
  usePostQuery,
  useUpdatePostMutation,
} from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useGetIntId } from '../../../utils/useGetIntId';

const EditPost = ({}) => {
  const router = useRouter();
  const intId = useGetIntId();
  const [{ data, fetching }] = usePostQuery({
    //if the id is not provided in the params the query will be paused
    pause: intId === -1,
    variables: {
      _id: intId,
    },
  });
  const [, updatePost] = useUpdatePostMutation();
  if (fetching) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }
  if (!data?.post) {
    return (
      <Layout>
        <Box>could not find post</Box>
      </Layout>
    );
  }
  return (
    <Layout variant="small">
      <Formik
        //sets the initial values for title and text fields to the current values before they are changed
        initialValues={{ title: data.post.title, text: data.post.text }}
        //onSubmits sends the values inputted by the end user for title and text to the server using updatePost();
        onSubmit={async (values) => {
          // const { error } = await createPost({ input: values });
          // if (!error) {
          //   router.push('/');
          // }
          //updates the title and text by finding the matching postId provided by the usePostQuery()
          await updatePost({ id: intId, ...values });
          //after the post is updated the router takes you back to the previous page
          router.back();
        }}
      >
        {(
          { isSubmitting } // isSubmitting is a boolean prop passed down from Formik. Submitting state of the form. Returns true if submission is in progress and false otherwise.
        ) => (
          //<form> element automatically hooks into Formik's handleSubmit and handleReset. All other props are passed directly through to the DOM node.
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                name="text"
                placeholder="text"
                label="Body"
                textarea
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              colorScheme="teal"
              //if isSubmitting is false then the spinning icon appears
              isLoading={isSubmitting}
            >
              update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(EditPost);
