import { usePostQuery } from '../generated/graphql';
import { useGetIntId } from './useGetIntId';

//useGetPostFromUrl return post by finding the matching post id provided in the parameters
export const useGetPostFromUrl = () => {
  //the useGetIntId returns the id provided in the params in integer format
  const intId = useGetIntId();
  return usePostQuery({
    //if the id is not provided in the params the query will be paused
    pause: intId === -1,
    variables: {
      _id: intId,
    },
  });
};
