export const dynamic = "force-dynamic"; // This ensures we get fresh data

export async function GET() {
  return Response.json({ message: "Hello there, welcome to my api!" });
}
