import { randomUUID } from "node:crypto";
import { rabbit } from "./rabbit";
import { EXCHANGES } from "./consts";
import { Envelope } from "./types";

export async function publishUserSignupEvent(input: {
  userId: string;
  email: string;
  plan: string;
}): Promise<string> {
  const id = randomUUID();

  const event: Envelope<typeof input> = {
    id,
    eventType: "user.signup",
    occurredAt: new Date().toISOString(),
    data: input,
  };

  await rabbit.publishToExchange(
    EXCHANGES.EVENTS,
    "user.signup",
    Buffer.from(JSON.stringify(event)),
    {
      messageId: id,
      correlationId: id,
      headers: {
        "x-source": "api",
      },
    }
  );

  return id;
}