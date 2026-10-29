import cloudinary, { cloudinaryReady } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-session";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!cloudinaryReady()) {
    return Response.json({ error: "Cloudinary is not configured. Check .env.local." }, { status: 503 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  const file = form.get("image");
  if (!file || typeof file.arrayBuffer !== "function") {
    return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: "Use a JPG, PNG, WebP, or AVIF image." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Image must be larger than 0 and no more than 8 MB." }, { status: 400 });
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const result = await cloudinary.uploader.upload(
      `data:${file.type};base64,${base64}`,
      {
        folder: "najeema-portfolio/projects",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [{ width: 1800, height: 1800, crop: "limit" }],
      }
    );
    return Response.json({ imageUrl: result.secure_url, imagePublicId: result.public_id });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return Response.json({ error: "Image upload failed. Check the Cloudinary settings." }, { status: 502 });
  }
}
