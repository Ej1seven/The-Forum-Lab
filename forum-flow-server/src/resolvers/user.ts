import { User } from '../entities/User';
import { MyContext } from 'src/types';
import argon2 from 'argon2';
import {
  Resolver,
  Query,
  Mutation,
  Field,
  Arg,
  Ctx,
  ObjectType,
} from 'type-graphql';
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME } from '../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
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
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string, @Ctx() { em }: MyContext) {
    // const user = await em.findOne(User, { email });
    return true;
  }

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
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    //argon2.hash is used to hash the password provided but the user.
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      //em is taken from EntityManager and used by KnexJs to add the username/password fields for that user to the Users table
      //After the user information is stored into the User table the user data is returned to the client.
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          email: options.email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      user = result[0];
    } catch (err) {
      //duplicate username error
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
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    //em.findOne is used by MikroOrm to find the user in the User table that has a matching username.
    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
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
    const valid = await argon2.verify(user.password, password);
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

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        } else {
          resolve(true);
        }
      })
    );
  }
}
