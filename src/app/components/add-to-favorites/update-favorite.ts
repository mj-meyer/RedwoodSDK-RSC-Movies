"use server";

import { addFavorite, removeFavorite } from "@/db";
import { requestInfo } from "rwsdk/worker";

export async function updateFavorite(formData: FormData) {
  const {
    ctx: { session },
  } = requestInfo;
  let movieId = formData.get("id");
  let intent = formData.get("intent");
  if (intent === "add") {
    await addFavorite(session.id, Number(movieId));
  } else {
    await removeFavorite(session.id, Number(movieId));
  }
}
