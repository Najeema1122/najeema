import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-session";
import { ObjectId } from "mongodb";

function isCloudinaryImage(url, publicId) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.includes("/image/upload/") &&
      typeof publicId === "string" && publicId.startsWith("najeema-portfolio/projects/");
  } catch {
    return false;
  }
}

function serialize(project) {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    imageUrl: project.imageUrl,
    imagePublicId: project.imagePublicId,
    createdAt: project.createdAt,
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const items = await db.collection("projects").find({}).sort({ createdAt: -1 }).limit(100).toArray();
    return Response.json({ projects: items.map(serialize) });
  } catch (error) {
    console.error("Project list failed:", error);
    return Response.json({ error: "Could not load projects. Check MongoDB setup." }, { status: 503 });
  }
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

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

  if (!title || title.length > 100) {
    return Response.json({ error: "Project title is required and must be 100 characters or fewer." }, { status: 400 });
  }
  if (!description || description.length > 2000) {
    return Response.json({ error: "Description is required and must be 2,000 characters or fewer." }, { status: 400 });
  }
  if (!isCloudinaryImage(imageUrl, imagePublicId)) {
    return Response.json({ error: "Upload a project image through the admin panel." }, { status: 400 });
  }

  try {
    const now = new Date();
    const result = await (await getDb()).collection("projects").insertOne({
      title,
      description,
      imageUrl,
      imagePublicId,
      createdAt: now,
      updatedAt: now,
    });
    return Response.json({
      project: serialize({ _id: result.insertedId, title, description, imageUrl, imagePublicId, createdAt: now }),
    }, { status: 201 });
  } catch (error) {
    console.error("Project create failed:", error);
    return Response.json({ error: "Could not save the project. Check MongoDB setup." }, { status: 503 });
  }
}
