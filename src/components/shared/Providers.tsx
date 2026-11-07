/** Sign-in is switched off in the static (GitHub Pages) build, where there is no server to handle it. */
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH !== 'off';
