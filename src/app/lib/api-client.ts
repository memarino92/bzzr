export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as { code?: string; message?: string };
  if (!response.ok)
    throw new ApiError(
      response.status,
      body.code ?? "REQUEST_FAILED",
      body.message ?? "Please try again.",
    );
  return body as T;
}

export async function postJson<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  return readResponse<T>(
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    }),
  );
}
