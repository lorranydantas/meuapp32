// Stripe webhook disabled
export async function POST(req: Request) {
  return new Response(JSON.stringify({ message: "Stripe webhook disabled" }), {
    status: 200,
  });
}
