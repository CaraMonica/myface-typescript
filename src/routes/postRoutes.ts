import express from "express";
import { CreatePostRequest } from "../models/api/createPostRequest";
import {
  createPost,
  dislikePost,
  getPageOfPosts,
  likePost,
  getNumLikes,
  getNumDislikes,
  removeInteraction,
} from "../services/postService";
import { body, validationResult } from "express-validator";

const router = express.Router();

router.get("/", async (request, response) => {
  const page = request.query.page ? parseInt(request.query.page as string) : 1;
  const pageSize = request.query.pageSize ? parseInt(request.query.pageSize as string) : 10;

  const postList = await getPageOfPosts(page, pageSize);
  return response.render("post_list", postList);
});

router.get("/create/", async (request, response) => {
  return response.render("create_post");
});

router.post(
  "/create/",
  body("message").notEmpty(),
  body("imageUrl").notEmpty(),
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }
    const post = request.body;

    await createPost(post as CreatePostRequest);
    return response.redirect("/posts/");
  }
);

const updateInteractions = async (request: express.Request, response: express.Response, update: Function) => {
  const userId = 1; // For now, just assume that we are user 1
  const postId = parseInt(request.params.postId);
  await update(userId, postId);
  const numLikes = await getNumLikes(postId);
  const numDislikes = await getNumDislikes(postId);
  response.status(200).send({ numLikes: numLikes, numDislikes: numDislikes });
};

router.post(
  "/:postId/like/",
  async (request, response) => await updateInteractions(request, response, likePost)
);

router.post(
  "/:postId/unlike/",
  async (request, response) => await updateInteractions(request, response, removeInteraction)
);

router.post(
  "/:postId/dislike/",
  async (request, response) => await updateInteractions(request, response, dislikePost)
);

router.post(
  "/:postId/undislike/",
  async (request, response) => await updateInteractions(request, response, removeInteraction)
);

export default router;
