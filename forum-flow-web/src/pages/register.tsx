import React from 'react';
//Formik is a small library that assist in creating forms by removing the three most annoying parts
//Getting values in and out of form state
//Validation and error messages
//Handling form submission
import { Formik, Form } from 'formik';
import { Box, Button } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
//Allows access the router object inside any function component
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';

interface registerProps {}

export const Register: React.FC<registerProps> = ({}) => {
  //variable used to access the router object through the useRouter() hook
  const router = useRouter();
  //useRegisterMutation() is a mutation used to register a new user.
  //The first index we left blank and it is used to display progress on the mutation - (not async)
  //the second index we named register and it is meant to run after the mutation has completed. - (async)
  const [, register] = useRegisterMutation();
  return (
    <Wrapper variant="small">
      <Formik
        //sets the initial values for username and password to an empty string
        initialValues={{ username: '', password: '' }}
        //onSubmits sends the values inputted by the end user for username and password to the server using register();
        onSubmit={async (values, { setErrors }) => {
          //register() uses the graphql client (urql) to send the data to the server.
          const response = await register(values);
          //if the server responds with a error the error message will appear below the input box
          //else if the server responds with the user data the user will be taken to another page
          if (response.data?.register.errors) {
            setErrors(toErrorMap(response.data.register.errors));
          } else if (response.data?.register.user) {
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
              name="username"
              placeholder="username"
              label="Username"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              colorScheme="teal"
              //if isSubmitting is false then the spinning icon appears
              isLoading={isSubmitting}
            >
              register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
