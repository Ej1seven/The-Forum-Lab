import { dedupExchange, fetchExchange } from 'urql';
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
} from '../generated/graphql';
import { betterUpdateQuery } from './betterUpdateQuery';
import { cacheExchange } from '@urql/exchange-graphcache';

//creates the GraphQL client which connects to the GraphQl server to query the database
export const createUrqlClient = (ssrExchange: any) => ({
  url: 'http://localhost:4000/graphql',
  fetchOptions: {
    credentials: 'include' as const,
  },
  //the default cacheExchange in urql offers a "Document Cache", which is usually enough for sites that heavily rely on static content. However as an app grows more complex it's likely that the data and state that urql manages, will also grow more complex and introduce interdependencies between data.
  //To solve this problem most GraphQL clients resort to caching data in a normalized format

  //exchanges are user to configure the cache into a normalized format
  exchanges: [
    //
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
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
    ssrExchange,
    fetchExchange,
  ],
});
