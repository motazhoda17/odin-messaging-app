import { validationResult } from "express-validator";

// Run after express-validator checks: if any failed, reply with 400
// and a list of messages the front end can show to the user.
export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array().map((e) => e.msg) });
  }
  next();
}
