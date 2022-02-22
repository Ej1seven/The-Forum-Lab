import { User } from '../entities/User';
import { MyContext } from 'src/types';
import argon2 from 'argon2';
import {
  Resolver,
  Query,
  Mutation,
  Field,
  InputType,
  Arg,
  Ctx,
  ObjectType,
} from 'type-graphql';
//UsernamePasswordInput receives the username and password parameters
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}
//FieldError displays the field ie(username, password) and the error message if the errors field comes returns true
@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}
//UserResponse is used when the end user registers. This ObjectType returns the user if the password and username fields are inputted correctly
//If either of these fields are not completed correctly the FieldError ObjectType will be used
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}
//The UserResolver is used register and login users of the application
@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { _id: req.session.userId });
    return user;
  }
  //the register mutation adds new users to the Users table. If the users username or password is not greater than 2 then an error message will return
  //otherwise the register mutation will return the newly created user object
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          { field: 'username', message: 'length must be greater than 2' },
        ],
      };
    }

    if (options.password.length <= 2) {
      return {
        errors: [
          { field: 'password', message: 'length must be greater than 2' },
        ],
      };
    }
    //argon2.hash is used to hash the password provided but the user.
    const hashedPassword = await argon2.hash(options.password);
    //em.create is used by MikroOrm to create a new user and add the username/password fields for that user to the Users table
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    try {
      //em.persistAndFlush is used by MikroOrm to push the newly created user to the User table
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === '23505') {
        return {
          errors: [{ field: 'username', message: 'username already exists' }],
        };
      }
    }
    //store user id session
    //this will set a cookie on the user
    //keep them logged in
    req.session.userId = user._id;

    return { user };
  }
  //the login mutation adds logs users in by first finding the username in the Users table. Once the user name is found it compares the passwords using argon2. If the users username or password are not correct an error message will return
  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    //em.findOne is used by MikroOrm to find the user in the User table that has a matching username.
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: "that username doesn't exist",
          },
        ],
      };
    }
    //argon2.verify compares the hash password to the password provided by the user
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }
    //Assigns the userId for this session to the user._id of the logged in user.
    //store user id session
    //this will set a cookie on the user
    //keep them logged in
    req.session.userId = user._id;

    return { user };
  }
}
