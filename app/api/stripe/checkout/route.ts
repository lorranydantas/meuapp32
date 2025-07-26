// Stripe checkout disabled
export async function GET(req: Request) {
  return new Response(JSON.stringify({ message: "Stripe disabled for now" }), {
    status: 200,
  });
}

export async function POST(req: Request) {
  return new Response(JSON.stringify({ message: "Stripe disabled for now" }), {
    status: 200,
  });
}
