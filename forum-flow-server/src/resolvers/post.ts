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
    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // });
    getConnection().query(
      `
    START TRANSACTION;

    insert into updoot ("userId", "postId", value)
    values (${userId}, ${postId}, ${realValue});

    update post p
    set points = points + ${realValue}
    where _id = ${postId};
    
    COMMIT
    `
    );
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

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(
      `
    select p.*,
    json_build_object('_id', u._id,'username', u.username, 'email', u.email, 'createdAt', u."createdAt", 'updatedAt', u."updatedAt") creator
    from post p
    inner join public.user u on u._id = p."creatorId"
    ${cursor ? `where p."createdAt" < $2` : ''}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );
    //build the query used to view the post
    // const queryBuilder = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder('p')
    //   .innerJoinAndSelect('p.creator', 'u', 'u._id = p."creatorId"')
    //   .orderBy('p."createdAt"', 'DESC')
    //   .take(realLimitPlusOne);
    // //if the cursor parameter is true then the all post created after the current post will be displayed
    // if (cursor) {
    //   queryBuilder.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }
    console.log('posts: ', posts);
    // const posts = await queryBuilder.getMany();
    //returns the post
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }
  //this query returns the post matching the id or return null
  @Query(() => Post, { nullable: true })
  //Uses the @Arg function from graphql to receive the id parameter
  //the post function matches the id parameter with the matching id in the Post table
  post(@Arg('id') _id: number): Promise<Post | undefined> {
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
  //this mutation updates the post by finding the post that matches the id parameter then checking if the title field is blank.
  //if the title field is not blank then the title is updated.
  //if none of the post match the id parameter then the updatePost mutation returns null
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') _id: number,
    @Arg('title', () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(_id);
    if (!post) {
      return null;
    }
    if (typeof title !== 'undefined') {
      await Post.update({ _id }, { title });
    }
    return post;
  }
  //this mutation deletes the post by finding the post that matches the id parameter
  //if the post is successfully deleted then the deletePost mutation return true otherwise
  //mutation returns false
  @Mutation(() => Boolean)
  async deletePost(@Arg('id') _id: number): Promise<boolean> {
    Post.delete(_id);
    return true;
  }
}
