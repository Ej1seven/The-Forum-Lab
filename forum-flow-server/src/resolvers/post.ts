import { Post } from '../entities/Post';
import { Resolver, Query, Ctx, Arg, Int, Mutation } from 'type-graphql';
import { MyContext } from '../types';

//PostResolver will be used to pull the necessary data from the Post table
@Resolver()
export class PostResolver {
  //this query returns all the posts from the Post table in a array
  @Query(() => [Post])
  //Uses the context property from buildschema located in index.ts and imports it using the @Ctx function in graphql to connect to the entity manager from MikroOrm.
  //We used an await statement to pull the orm data and this is reason for defining Promise<Post[]> in Typescript
  //the posts function is used by graphql to pull all the posts from the Post table
  async posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }
  //this query returns the post matching the id or return null
  @Query(() => Post, { nullable: true })
  //Uses the @Arg function from graphql to receive the id parameter
  //the post function matches the id parameter with the matching id in the Post table
  post(@Arg('id') _id: number, @Ctx() { em }: MyContext): Promise<Post | null> {
    return em.findOne(Post, { _id });
  }
  //Mutation is used to create, delete or update data in the database
  //this mutation creates a new post in the Post table
  @Mutation(() => Post)
  async createPost(
    @Arg('title') title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }
  //this mutation updates the post by finding the post that matches the id parameter then checking if the title field is blank.
  //if the title field is not blank then the title is updated.
  //if none of the post match the id parameter then the updatePost mutation returns null
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') _id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { _id });
    if (!post) {
      return null;
    }
    if (typeof title !== 'undefined') {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }
  //this mutation deletes the post by finding the post that matches the id parameter
  //if the post is successfully deleted then the deletePost mutation return true otherwise
  //mutation returns false
  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id') _id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    await em.nativeDelete(Post, { _id });
    return true;
  }
}
