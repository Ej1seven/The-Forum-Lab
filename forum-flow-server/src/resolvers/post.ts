import { Post } from '../entities/Post';
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType,
} from 'type-graphql';
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}
//PostResolver will be used to pull the necessary data from the Post table
//I added Post inside the @Resolver because we needed to clarify the entity when using the @FieldResolver
@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  //@textSnippet() takes the post text and slices it to a max of 50 characters
  //the textSnippet() will be returned every time the client request a Post object
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }
  //anytime a post is requested the server will also fetch the creator by matching the userId with the creatorId
  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post._id,
      userId: req.session.userId,
    });
    return updoot ? updoot.value : null;
  }
  //this query adds an up vote or down vote to the selected post
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    //checks to see if the user has already voted on the post by finding the postId then checking to see if the user's id is attached
    const updoot = await Updoot.findOne({ where: { postId, userId } });
    //the user has voted on the post before
    //and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          //this transaction inserts the "userId", "postId", and value into the updoot table
          `update updoot
        set value = $1
        where "postId" = $2 and "userId" = $3`,
          [realValue, postId, userId]
        );
        //if the user changes their vote it either adds or subtracts by two to prevent the value from being 0
        await tm.query(
          `update post
        set points = points + $1
        where _id = $2
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      //has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          //this transaction inserts the "userId", "postId", and value into the updoot table
          `insert into updoot ("userId", "postId", value)
        values ($1, $2, $3)`,
          [userId, postId, realValue]
        );
        await tm.query(
          //and adds or subtracts a point from the points field on the selected post
          `update post p
        set points = points + $1
        where _id = $2`,
          [realValue, postId]
        );
      });
    }
    return true;
  }
  //this query returns all the posts from the Post table in a array
  @Query(() => PaginatedPosts)
  //Uses the context property from buildschema located in index.ts and imports it using the @Ctx function in graphql to connect to the entity manager from TypeOrm.
  //We used an await statement to pull the orm data and this is reason for defining Promise<Post[]> in Typescript
  //the posts function is used by graphql to pull all the posts from the Post table
  async posts(
    //'limit' set the limit for the amount of post that can be viewed on the webpage
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    //set the limit for the amount of post that can be viewed
    //the limit is set to a max of 50
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    //the cursor toggles between 2 and 3 depending on if the user is logged in when they click the load more button
    //if the user is logged in when they push the load more button then the cursor will be 3
    //if the user is not logged in when they select the load more button the cursor will be 2
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    //the posts querybuilder creates an creator object on the POST table and joins it with the User table by comparing the userID to the creatorId columns
    //the server then checks to see if the user is logged in, if they are then the server checks to see if the user has already voted on the post. If the user has already voteStatus returns 1 or -1 depending on if they selected upvote(1) or downvote(-1), otherwise the voteStatus remains null
    //if the cursor is true then the createdAt field on the post replaces the cursor with the new date
    //the posts are displayed in descending order from newest post to oldest post
    //limit is set to realLimitPlusOne
    const posts = await getConnection().query(
      `
    select p.*
    from post p
    ${cursor ? `where p."createdAt" < $2` : ''}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }
  //this query returns the post matching the id or return null
  @Query(() => Post, { nullable: true })
  //Uses the @Arg function from graphql to receive the id parameter
  //the post function matches the id parameter with the matching id in the Post table
  post(@Arg('_id', () => Int) _id: number): Promise<Post | undefined> {
    return Post.findOne(_id);
  }
  //Mutation is used to create, delete or update data in the database
  //this mutation creates a new post in the Post table
  @Mutation(() => Post)
  //isAuth ensures the use is authenticated by making sure the session userId is true before allowing them to create post
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }
  //this mutation updates the post by finding the post that matches the id parameter and making sure the creatorId matches the userId .
  //the post is updated with the title and text arguments
  //then the entire post is returned using the result.raw[0]
  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) _id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('_id = :_id and "creatorId" = :creatorId', {
        _id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute();
    console.log('result: ', result);
    return result.raw[0];
  }
  //this mutation deletes the post by finding the post that matches the id parameter
  //if the post is successfully deleted then the deletePost mutation return true otherwise
  //mutation returns false
  //the user must be logged in order to delete post
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) _id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    //the Post.delete function makes sure the user can only delete their own post
    await Post.delete({ _id, creatorId: req.session.userId });
    return true;
  }
}
