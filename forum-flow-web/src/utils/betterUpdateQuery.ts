import { Cache, QueryInput } from '@urql/exchange-graphcache';

//urql does not create good types for Typescript when updating the cache, so I used the betterUpdateQuery() function to better cast the types
//when updating the query in cache for GraphQL clients
export function betterUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
