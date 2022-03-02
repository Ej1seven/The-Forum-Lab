import { Box, Flex, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import Link from 'next/link';
import router from 'next/router';
import React from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { toErrorMap } from '../utils/toErrorMap';
import login from './login';

const CreatePost: React.FC<{}> = ({}) => {
  return (
    <Wrapper variant="small">
      <Formik
        //sets the initial values for username and password to an empty string
        initialValues={{ title: '', text: '' }}
        //onSubmits sends the values inputted by the end user for username and password to the server using login();
        onSubmit={async (values, { setErrors }) => {
          //login() uses the graphql client (urql) to send the data to the server.
          console.log(values); //if the server responds with a error the error message will appear below the input box
          //else if the server responds with the user data the user will be taken to another page
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
              login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default CreatePost;
