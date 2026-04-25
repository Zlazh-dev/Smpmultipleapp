import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Must mock env before importing middleware
vi.stubEnv("NEXT_PUBLIC_TU_URL", "http://tu.localhost");
vi.stubEnv("NEXT_PUBLIC_RADIG_URL", "http://radig.localhost");

// Import after env is set
const { middleware } = await import("@/middleware");

function createRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
  const req = new NextRequest(new URL(url));
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe("Portal Middleware", () => {
  describe("Subdomain detection", () => {
    it("redirects tu.example.com to TU URL", () => {
      const req = createRequest("http://tu.example.com/");
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://tu.localhost/");
    });

    it("redirects radig.example.com to RADIG URL", () => {
      const req = createRequest("http://radig.example.com/");
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://radig.localhost/");
    });

    it("does NOT redirect portal.example.com", () => {
      const req = createRequest("http://portal.example.com/");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("does NOT redirect localhost", () => {
      const req = createRequest("http://localhost:3000/");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("does NOT redirect www.example.com", () => {
      const req = createRequest("http://www.example.com/");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Dashboard auth protection", () => {
    it("redirects /dashboard to /login without session cookie", () => {
      const req = createRequest("http://portal.localhost/dashboard");
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("allows /dashboard with session cookie and adds no-cache", () => {
      const req = createRequest("http://portal.localhost/dashboard", {
        "portal.session-token": "valid-token",
      });
      const res = middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("no-cache");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(res.headers.get("Pragma")).toBe("no-cache");
    });

    it("redirects /dashboard/guru without session", () => {
      const req = createRequest("http://portal.localhost/dashboard/guru");
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });
  });

  describe("Public routes", () => {
    it("allows / without auth", () => {
      const req = createRequest("http://portal.localhost/");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows /login without auth", () => {
      const req = createRequest("http://portal.localhost/login");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows /register without auth", () => {
      const req = createRequest("http://portal.localhost/register");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });
});
