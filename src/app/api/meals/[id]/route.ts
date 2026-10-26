import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server";

/** DELETE /api/meals/[id] — remove a saved meal */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("saved_meals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError("not found", 404);
  }

  return Response.json({ ok: true });
}
