import { Errors } from '../utils/errors.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err?.issues) {
        return next(Errors.validation(err.issues));
      }
      next(err);
    }
  };
}
