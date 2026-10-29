import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import cloudinary, { cloudinaryReady } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-session";

function validImage(url, publicId) {
  try {
    return new URL(url).hostname === "res.cloudinary.com" &&
      url.includes("/image/upload/") &&
      typeof publicId === "string" &&
      publicId.startsWith("najeema-portfolio/projects/");
  } catch {
    return false;
  }
}

export async function PUT(request, { params }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid project ID." }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
  const imagePublicId = typeof body.imagePublicId === "string" ? body.imagePublicId : "";
  if (!title || title.length > 100 || !description || description.length > 2000) {
    return Response.json({ error: "Enter a title and description within the listed limits." }, { status: 400 });
  }
  if (!validImage(imageUrl, imagePublicId)) {
    return Response.json({ error: "The project image is not a valid portfolio upload." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const collection = db.collection("projects");
    const oldProject = await collection.findOne({ _id: new ObjectId(id) });
    if (!oldProject) return Response.json({ error: "Project not found." }, { status: 404 });

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, description, imageUrl, imagePublicId, updatedAt: new Date() } }
    );

    if (oldProject.imagePublicId && oldProject.imagePublicId !== imagePublicId && cloudinaryReady()) {
      try { await cloudinary.uploader.destroy(oldProject.imagePublicId); }
      catch (error) { console.error("Old Cloudinary image cleanup failed:", error); }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Project update failed:", error);
    return Response.json({ error: "Could not update the project. Check MongoDB setup." }, { status: 503 });
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid project ID." }, { status: 400 });

  try {
    const db = await getDb();
    const collection = db.collection("projects");
    const project = await collection.findOne({ _id: new ObjectId(id) });
    if (!project) return Response.json({ error: "Project not found." }, { status: 404 });

    if (project.imagePublicId && cloudinaryReady()) {
      await cloudinary.uploader.destroy(project.imagePublicId);
    }
    await collection.deleteOne({ _id: new ObjectId(id) });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Project delete failed:", error);
    return Response.json({ error: "Could not delete the project. Check MongoDB and Cloudinary setup." }, { status: 503 });
  }
}
