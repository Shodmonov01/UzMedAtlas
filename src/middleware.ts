import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { parseUtmSearch, serializeUtm } from "./lib/utm";

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intl(request);
  if (!request.cookies.get("uma_session")?.value) {
    const id = crypto.randomUUID().replaceAll("-", "");
    response.cookies.set("uma_session", id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  const utm = parseUtmSearch(request.nextUrl.searchParams);
  if (utm) {
    response.cookies.set("uma_utm", serializeUtm(utm), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|uploads|clinics|ornaments|.*\\..*).*)"],
};
