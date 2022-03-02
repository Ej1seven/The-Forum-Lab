import { Box, Flex, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import Link from 'next/link';
import router from 'next/router';
import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { toErrorMap } from '../utils/toErrorMap';
import login from './login';

export const ForgotPassword: React.FC<{}> = ({}) => {
  const [complete, setComplete] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();
  return (
    <Wrapper variant="small">
      <Formik
        //sets the initial values for username and password to an empty string
        initialValues={{ email: '' }}
        //onSubmits sends the values inputted by the end user for username and password to the server using login();
        onSubmit={async (values) => {
          //login() uses the graphql client (urql) to send the data to the server.
          await forgotPassword(values);
          setComplete(true);
        }}
      >
        {(
          { isSubmitting } // isSubmitting is a boolean prop passed down from Formik. Submitting state of the form. Returns true if submission is in progress and false otherwise.
        ) =>
          complete ? (
            <Box>
              if an account with that email exist, we sent you an email{' '}
            </Box>
          ) : (
            //<form> element automatically hooks into Formik's handleSubmit and handleReset. All other props are passed directly through to the DOM node.
            <Form>
              <InputField
                name="email"
                placeholder="email"
                label="Email"
                type="email"
              />

              <Button
                mt={4}
                type="submit"
                colorScheme="teal"
                //if isSubmitting is false then the spinning icon appears
                isLoading={isSubmitting}
              >
                forgot password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
