import React from 'react';
//Formik is a small library that assist in creating forms by removing the three most annoying parts
//Getting values in and out of form state
//Validation and error messages
//Handling form submission
import { Formik, Form } from 'formik';
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
//Allows access the router object inside any function component
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link';

export const Login: React.FC<{}> = ({}) => {
  //variable used to access the router object through the useRouter() hook
  const router = useRouter();
  //useLoginMutation() is a mutation used to verify the users credentials then log them in.
  //The first index we left blank and it is used to display progress on the mutation - (not async)
  //the second index we named register and it is meant to run after the mutation has completed. - (async)
  const [, login] = useLoginMutation();
  return (
    <Wrapper variant="small">
      <Formik
        //sets the initial values for username and password to an empty string
        initialValues={{ usernameOrEmail: '', password: '' }}
        //onSubmits sends the values inputted by the end user for username and password to the server using login();
        onSubmit={async (values, { setErrors }) => {
          //login() uses the graphql client (urql) to send the data to the server.
          const response = await login(values);
          //if the server responds with a error the error message will appear below the input box
          //else if the server responds with the user data the user will be taken to another page
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            // worked
            router.push('/');
          }
        }}
      >
        {(
          { isSubmitting } // isSubmitting is a boolean prop passed down from Formik. Submitting state of the form. Returns true if submission is in progress and false otherwise.
        ) => (
          //<form> element automatically hooks into Formik's handleSubmit and handleReset. All other props are passed directly through to the DOM node.
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="username or email"
              label="Username or Email"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>
            <Flex mt={2}>
              <NextLink href="/forgot-password">
                <Link ml="auto">forgot password?</Link>
              </NextLink>
            </Flex>
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

export default withUrqlClient(createUrqlClient)(Login);
