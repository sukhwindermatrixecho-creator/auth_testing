export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number, // declares and assigns the property in the constructor automatically.
    ) {
        super(message);
        this.name = "AppError"; // gives the error a clear name when logged.
        // preserves the correct prototype if you later extend AppError with specialized error classes.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}