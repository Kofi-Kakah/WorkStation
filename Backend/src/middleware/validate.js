/**
 * Build an Express middleware that validates `req.body` against a Zod schema.
 * On success, replaces `req.body` with the parsed (and coerced) value.
 * On failure, returns 400 with a structured validation error.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
    const result = schema.safeParse(data);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    if (source === 'body') req.body = result.data;
    else if (source === 'params') req.params = result.data;
    else req.query = result.data;

    return next();
  };
}

export const validateBody = (schema) => validate(schema, 'body');
export const validateParams = (schema) => validate(schema, 'params');
export const validateQuery = (schema) => validate(schema, 'query');

export default validate;