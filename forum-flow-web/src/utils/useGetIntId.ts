import { useRouter } from 'next/router';

//router.query.id allows you to get the parameters from the url "http://localhost:3000/post/${id}" and return the id portion of the query turning it into an integer
//the useGetIntId returns the id provided in the params in integer format
export const useGetIntId = () => {
  const router = useRouter();
  //the ternary statement below checks to see if a id was provided in the params
  // if not the id will be set to -1 and since there are no post ids with -1 the query will be paused
  const intId =
    typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

  return intId;
};
