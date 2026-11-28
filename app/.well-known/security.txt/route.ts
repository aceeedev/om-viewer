import { cacheLife } from "next/cache";
import { securityTxt } from "@/lib/security-txt";

/**
 * /.well-known/security.txt (RFC 9116): tells security researchers where to report a problem. Built at
 * build time, then rebuilt at most once a week when it's requested, so its `Expires` date stays current
 * without a new deploy.
 */
export async function GET() {
  return new Response(await currentSecurityTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// `use cache` can't go in the handler itself. Reading the clock here is what the cache holds on to.
async function currentSecurityTxt() {
  "use cache";
  cacheLife("weeks");
  return securityTxt(new Date());
}
