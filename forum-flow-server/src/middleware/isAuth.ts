import { MyContext } from 'src/types';
import { MiddlewareFn } from 'type-graphql';
//middleware function runs before the resolvers is execucuted
//isAuth makes sure the user is Authenticated before allow them to proceed with the resolver
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('not authenticated');
  }
  //if the function is successful the next() function allows you to proceed with the resolver
  return next();
};
