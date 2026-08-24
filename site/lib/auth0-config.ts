export function isAuth0Configured() {
  const domain = process.env.AUTH0_DOMAIN
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();

  return Boolean(
    domain &&
      domain !== "auth0.auth0.com" &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET &&
      process.env.AUTH0_SECRET &&
      process.env.APP_BASE_URL
  );
}
