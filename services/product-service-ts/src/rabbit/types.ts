export type Envelope<T> = {
  id: string;
  eventType: string;
  occurredAt: string;
  data: T;
};

export type RabbitHeaders = Record<string, string | number | boolean | undefined>;

export class RetryableError extends Error {
  readonly retryable = true;
}

export class FatalError extends Error {
  readonly retryable = false;
}