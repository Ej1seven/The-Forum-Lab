import { Field, InputType } from 'type-graphql';

//UsernamePasswordInput receives the username and password parameters
@InputType()
export class UsernamePasswordInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}
