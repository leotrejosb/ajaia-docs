export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = () => new AppError(404, "Document not found");
export const forbidden = (msg = "You don't have permission to do that") => new AppError(403, msg);
export const badRequest = (msg: string) => new AppError(400, msg);
export const unauthorized = () => new AppError(401, "Please sign in");
