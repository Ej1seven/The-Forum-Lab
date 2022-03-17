import { dedupExchange, fetchExchange, stringifyVariables } from 'urql';
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  VoteMutationVariables,
  DeletePostMutationVariables,
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQuery';
import { cacheExchange, Resolver, Cache } from '@urql/exchange-graphcache';
import { Exchange } from 'urql';
import { pipe, tap } from 'wonka';
import Router from 'next/router';
import { gql } from '@urql/core';
import { resourceLimits } from 'worker_threads';
import { isServer } from './isServer';

//handle all errors. Allow global error handling
//everytime there is an error in the application it refers to the errorExchange function

const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        //if the error message include not authenticated then the user will be routed to the homepage
        if (error?.message.includes('not authenticated')) {
          Router.replace('/login');
        }
      })
    );
  };

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    console.log(info);
    //entityKey = Query, fieldName = posts,
    const { parentKey: entityKey, fieldName } = info;
    //allFields get all the queries in the cache
    const allFields = cache.inspectFields(entityKey);
    //filters out all the queries that do not match the fieldName
    //in this function the filter method returns posts
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    //returns undefined if there are no posts
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    //fieldsArgs is the data we pass into the posts query ex: {cursor: '1644599009000', limit: 15}
    // fieldKey ex: posts({"cursor":"1644599009000","limit":15})
    // the cache.resolve() method allows us to access Graphcache's cached data directly. It is used to resolve records or links on any given entity and accepts three arguments:
    //entity: This is the entity on which we'd like to access a field.
    //fieldName: This is the field's name we'd like to access.
    //fieldArgs: Optionally, as the third argument we may pass the field's arguments
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    //checks to see if there are post in the cache
    const isItInTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      'posts'
    );
    console.log(isItInTheCache);
    //if info.partial is true it tells there server that we got partial data from the cache and the client fetches more data
    info.partial = !isItInTheCache;
    //hasMore is used to determine if there are more post that have not been displayed
    let hasMore = true;
    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, 'posts') as string[];
      const _hasMore = cache.resolve(key, 'hasMore');
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    });

    return { __typename: 'PaginatedPosts', hasMore, posts: results };
  };
};

function invalidateAllPost(cache: Cache) {
  const allFields = cache.inspectFields('Query');
  const fieldInfos = allFields.filter((info) => info.fieldName === 'posts');
  fieldInfos.forEach((fi) => {
    cache.invalidate('Query', 'posts', fi.arguments || {});
  });
}

//creates the GraphQL client which connects to the GraphQl server to query the database
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = '';
  //if the server has a cookie then add the value to the cookie variable
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }
  return {
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: 'include' as const,
      //if the request header has a cookie then it adds the cookie to the header
      //this allows the server to send a cookie to the browser
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    //the default cacheExchange in urql offers a "Document Cache", which is usually enough for sites that heavily rely on static content. However as an app grows more complex it's likely that the data and state that urql manages, will also grow more complex and introduce interdependencies between data.
    //To solve this problem most GraphQL clients resort to caching data in a normalized format

    //exchanges are user to configure the cache into a normalized format
    exchanges: [
      //
      dedupExchange,
      cacheExchange({
        //tells the urql client that PaginatedPosts does not have an ID
        keys: {
          PaginatedPosts: () => null,
        },
        //adds client side resolvers that can run computed values whenever the query is run
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            //when the user deletes a post the cache is updated automatically so the user does not have to refresh the page in order to see that their post has been deleted
            deletePost: (_result, args, cache, info) => {
              cache.invalidate({
                __typename: 'Post',
                _id: (args as DeletePostMutationVariables).id,
              });
            },
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              //readFragment gets the current _id, points and voteStatus of the selected post from the Post entity
              //voteStatus tells the server if the user has upvoted/downvoted on the post before
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    _id
                    points
                    voteStatus
                  }
                `,
                { _id: postId } as any // this identifies the fragment (Post) entity
              );
              console.log('data:', data);

              if (data) {
                if (data.voteStatus === value) {
                  return;
                }
                //the new number of the points for the selected post
                const newPoints =
                  //if the user has already voted the post then 2 points will be added to post to prevent the post from going back to 0, otherwise if the user has not already voted then only one point is added
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
                //the writeFragment adds points to the selected post from the Post entity
                //the voteStatus also gets updated with either a 1 for upvote or -1 for downvote
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { _id: postId, points: newPoints, voteStatus: value } as any
                );
              }
            },
            //when the createPost mutation is called it is removing all the post query arguments from the cache by invalidating the arguments forcing the server to refetch the data
            //I performed this action so the user can automatically see their new post at the top of the list
            createPost: (_result, args, cache, info) => {
              invalidateAllPost(cache);
            },
            logout: (_result, args, cache, info) => {
              //when the LogoutMutation is ran the _id/username will be removed from the MeQuery and the user will be logged out
              betterUpdateQuery<LogoutMutation, MeQuery>(
                // The cache instance, which gives us access to methods allowing us to interact with the local cache.
                cache,
                //the input provided to the MeQuery i.e(_id, username)
                //this information will be updated after the function is ran
                { query: MeDocument },
                //The full API result that's being written to the cache
                _result,
                //the me property in the MeQuery will be set up null
                //this event will caused the user to be logged out
                () => ({ me: null })
              );
            },
            //if the user successfully logs in, the MeQuery will be updated with the user's id and username
            login: (_result, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                {
                  query: MeDocument,
                },
                _result,
                (result, query) => {
                  //if the user does not successfully login the MeQuery will remain blank otherwise the MeQuery will be provided with the
                  //_id and username
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPost(cache);
              // ...
            },
            //if the user does not successfully register, the MeQuery will remain blank otherwise the MeQuery will be provided with the
            //_id and username
            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                {
                  query: MeDocument,
                },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
              // ...
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
