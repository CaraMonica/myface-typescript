import { database } from "./database";
import { Interaction, InteractionType } from "../models/database/interaction";

export async function createInteraction(
  userId: number,
  postId: number,
  interactionType: InteractionType
): Promise<void> {
  await database<Interaction>("interactions").insert({
    userId,
    postId,
    interactionType,
    date: database.fn.now(),
  });
}

export async function deleteInteraction(userId: number, postId: number): Promise<void> {
  await database<Interaction>("interactions").where({ userId: userId, postId: postId}).del();
}
