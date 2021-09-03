import { Page } from "../models/api/page";
import { PostModel } from "../models/api/postModel";
import * as postRepo from "../repos/postRepo";
import { getByPostInteraction, getUser } from "../repos/userRepo";
import { Post } from "../models/database/post";
import { CreatePostRequest } from "../models/api/createPostRequest";
import { createInteraction, deleteInteraction } from "../repos/interactionRepo";
import { User } from "../models/database/user";

export async function getPageOfPosts(page: number, pageSize: number): Promise<Page<PostModel>> {
  const posts = await postRepo.getPosts(page, pageSize);
  const postsCount = await postRepo.countPosts();

  // This way of generating a list of post models is VERY inefficient
  // due to all the DB calls in the toPostModel function.
  // In total it will be (3N + 1) DB calls (where N is the number of items in page).
  // A better solution would be to do these joins in the SQL...
  // but that's quite a lot of effort without support from an ORM...
  // and we should get away with it for small local databases like ours.
  const postModels = await Promise.all(posts.map(toPostModel));

  return {
    results: postModels,
    next: page * pageSize < postsCount ? `/posts/?page=${page + 1}&pageSize=${pageSize}` : null,
    previous: page > 1 ? `/posts/?page=${page - 1}&pageSize=${pageSize}` : null,
    total: postsCount,
  };
}

export async function createPost(newPost: CreatePostRequest): Promise<void> {
  await postRepo.createPost(newPost);
}

export async function removeInteraction(userId: number, postId: number): Promise<void> {
  return deleteInteraction(userId, postId);
}

export async function likePost(userId: number, postId: number): Promise<void> {
  await deleteInteraction(userId, postId);
  return createInteraction(userId, postId, "LIKE");
}

export async function dislikePost(userId: number, postId: number): Promise<void> {
  await deleteInteraction(userId, postId);
  return createInteraction(userId, postId, "DISLIKE");
}

export async function getNumLikes(postId: number): Promise<number> {
  const userList = await getByPostInteraction(postId, "LIKE", 1, 10)
  return userList.length;
}

export async function getNumDislikes(postId: number): Promise<number> {
  const userList = await getByPostInteraction(postId, "DISLIKE", 1, 10)
  return userList.length;
}

async function toPostModel(post: Post): Promise<PostModel> {
  const likedBy = await getByPostInteraction(post.id, "LIKE", 1, 10);
  const dislikedBy = await getByPostInteraction(post.id, "DISLIKE", 1, 10);
  return {
    id: post.id,
    message: post.message,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    postedBy: await getUser(post.userId),
    likedBy: likedBy,
    dislikedBy: dislikedBy,
    isLikedByCurrentUser: likedBy.some(user => user.id === 1),
    isDislikedByCurrentUser: dislikedBy.some(user => user.id === 1),
  };
}
