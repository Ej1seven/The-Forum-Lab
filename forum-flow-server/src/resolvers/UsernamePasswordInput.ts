import { Field, InputType } from 'type-graphql';

//UsernamePasswordInput receives the username,password, and email parameters
@InputType()
export class UsernamePasswordInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}
