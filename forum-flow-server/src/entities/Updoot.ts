import { ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from './Post';
import { User } from './User';

//many to many relationship
//many users can upvote/downvote many posts
//user => updoot <- posts
@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  @Column({ type: 'int' })
  value: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.updoots)
  user: User;

  @PrimaryColumn()
  postId: number;

  //onDelete: CASCADE deletes any updoots that are tied to the deleted post when the post is deleted
  @ManyToOne(() => Post, (post) => post.updoots, {
    onDelete: 'CASCADE',
  })
  post: Post;
}
