import jwt from "jsonwebtoken";

// Create a signed JWT that identifies the user. The client stores it and
// sends it back in the Authorization header on every request.
export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
