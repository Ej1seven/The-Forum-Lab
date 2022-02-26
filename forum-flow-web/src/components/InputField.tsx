import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import { useField } from 'formik';
import React, { InputHTMLAttributes } from 'react';
//uses Typescript to define InputFieldProps to the InputHTMLAttributes. In simple terms this statement ensures that the InputField component takes any props a regular HTML input would take
type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  size: _,
  ...props
}) => {
  //the useField hook from formik passes all the InputField props to the form label and input fields
  //the error object is used when there is a error in the input field.
  const [field, { error }] = useField(props);
  return (
    //if the error object is not empty isInvalid will show true and the FormErrorMessage will show
    //The htmlFor property sets or returns the value of the for attribute of a label
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <Input {...field} {...props} id={field.name} />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};
