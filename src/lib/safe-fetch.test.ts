import { afterEach, describe, expect, it, vi } from "vitest";
import {
  UnsafeUrlError,
  assertPublicUrl,
  isPublicAddress,
  safeFetch,
} from "./safe-fetch";

const PUBLIC_IP = "93.184.216.34";
const publicResolver = async () => [PUBLIC_IP];

describe("isPublicAddress", () => {
  it.each([
    "8.8.8.8",
    "93.184.216.34",
    "172.15.255.255",
    "172.32.0.1",
    "100.63.255.255",
    "100.128.0.1",
    "2606:4700:4700::1111",
    "2001:4860:4860::8888",
  ])("treats %s as public", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
  ])("treats %s as not public", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it("treats IPv4-mapped private IPv6 addresses as not public", () => {
    expect(isPublicAddress("::ffff:10.0.0.1")).toBe(false);
    expect(isPublicAddress("::ffff:127.0.0.1")).toBe(false);
    expect(isPublicAddress("::ffff:169.254.169.254")).toBe(false);
    expect(isPublicAddress("::ffff:a00:1")).toBe(false);
  });

  it("treats IPv4-mapped public IPv6 addresses as public", () => {
    expect(isPublicAddress("::ffff:8.8.8.8")).toBe(true);
  });

  it.each(["example.com", "", "not an ip", "999.1.1.1"])(
    "treats the non-IP string %j as not public",
    (value) => {
      expect(isPublicAddress(value)).toBe(false);
    }
  );
});

describe("assertPublicUrl", () => {
  it.each(["file:///etc/passwd", "ftp://example.com/x", "javascript:alert(1)"])(
    "rejects the scheme in %s",
    async (url) => {
      await expect(assertPublicUrl(url, publicResolver)).rejects.toBeInstanceOf(
        UnsafeUrlError
      );
    }
  );

  it.each(["", "not a url", "//example.com", "example.com/recipe"])(
    "rejects the invalid URL %j",
    async (url) => {
      await expect(assertPublicUrl(url, publicResolver)).rejects.toBeInstanceOf(
        UnsafeUrlError
      );
    }
  );

  it("rejects URLs with credentials", async () => {
    await expect(
      assertPublicUrl("http://user:pass@example.com", publicResolver)
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(
      assertPublicUrl("http://user@example.com", publicResolver)
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it.each([
    "http://127.0.0.1/",
    "http://10.0.0.5/admin",
    "http://169.254.169.254/latest/meta-data",
    "http://192.168.0.1:8080/",
    "http://[::1]/",
    "http://[fe80::1]/",
    "http://[fd00::1]/",
    "http://[::ffff:10.0.0.1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://2130706433/",
    "http://0x7f.0.0.1/",
  ])("rejects the private IP literal %s without resolving", async (url) => {
    const resolve = vi.fn(async () => [PUBLIC_IP]);
    await expect(assertPublicUrl(url, resolve)).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("rejects a hostname that resolves to a private address", async () => {
    await expect(
      assertPublicUrl("http://internal.example.com/", async () => ["10.0.0.7"])
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects a hostname that resolves to both public and private addresses", async () => {
    await expect(
      assertPublicUrl("http://mixed.example.com/", async () => [PUBLIC_IP, "127.0.0.1"])
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(
      assertPublicUrl("http://mixed.example.com/", async () => ["::1", PUBLIC_IP])
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects a hostname that resolves to nothing", async () => {
    await expect(
      assertPublicUrl("http://ghost.example.com/", async () => [])
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects a hostname whose resolver throws", async () => {
    await expect(
      assertPublicUrl("http://nxdomain.example.com/", async () => {
        throw new Error("ENOTFOUND");
      })
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("accepts a hostname that resolves to public addresses", async () => {
    const resolve = vi.fn(async () => [PUBLIC_IP, "2606:4700:4700::1111"]);
    const url = await assertPublicUrl("https://example.com/recipe?id=1", resolve);
    expect(url.href).toBe("https://example.com/recipe?id=1");
    expect(resolve).toHaveBeenCalledWith("example.com");
  });

  it("accepts a public IP literal without resolving", async () => {
    const resolve = vi.fn(async () => ["10.0.0.1"]);
    const url = await assertPublicUrl("http://8.8.8.8/", resolve);
    expect(url.hostname).toBe("8.8.8.8");
    expect(resolve).not.toHaveBeenCalled();
  });

  it("accepts a public IPv6 literal", async () => {
    const url = await assertPublicUrl("http://[2606:4700:4700::1111]/", publicResolver);
    expect(url.protocol).toBe("http:");
  });
});

describe("safeFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function redirect(location: string, status = 302) {
    return new Response(null, { status, headers: { location } });
  }

  function stubFetch(...responses: Response[]) {
    const fetchMock = vi.fn();
    for (const r of responses) fetchMock.mockResolvedValueOnce(r);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("returns the response for a 200", async () => {
    const ok = new Response("hello", { status: 200 });
    const fetchMock = stubFetch(ok);
    const response = await safeFetch("https://example.com/a", {}, publicResolver);
    expect(response).toBe(ok);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("asks fetch not to follow redirects itself and forwards init", async () => {
    const fetchMock = stubFetch(new Response("ok"));
    await safeFetch(
      "https://example.com/a",
      { headers: { "user-agent": "test" } },
      publicResolver
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(init.redirect).toBe("manual");
    expect(init.headers).toEqual({ "user-agent": "test" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("follows a redirect to a public host", async () => {
    const final = new Response("final", { status: 200 });
    const fetchMock = stubFetch(redirect("https://other.example.org/b"), final);
    const response = await safeFetch("https://example.com/a", {}, publicResolver);
    expect(response).toBe(final);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://other.example.org/b");
  });

  it("rejects a redirect to a private address and does not fetch it", async () => {
    const fetchMock = stubFetch(
      redirect("http://169.254.169.254/latest/meta-data"),
      new Response("secret")
    );
    await expect(
      safeFetch("https://example.com/a", {}, publicResolver)
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a redirect to a hostname that resolves privately", async () => {
    const resolve = async (host: string) =>
      host === "evil.example.org" ? ["192.168.1.1"] : [PUBLIC_IP];
    const fetchMock = stubFetch(redirect("https://evil.example.org/"), new Response("x"));
    await expect(safeFetch("https://example.com/a", {}, resolve)).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a private starting URL without fetching", async () => {
    const fetchMock = stubFetch(new Response("x"));
    await expect(safeFetch("http://127.0.0.1/", {}, publicResolver)).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves relative Location headers against the current URL", async () => {
    const fetchMock = stubFetch(
      redirect("/moved/here"),
      redirect("sibling"),
      new Response("done")
    );
    await safeFetch("https://example.com/dir/page", {}, publicResolver);
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://example.com/moved/here");
    expect(String(fetchMock.mock.calls[2][0])).toBe("https://example.com/moved/sibling");
  });

  it("returns a redirect response that has no Location header", async () => {
    const noLocation = new Response(null, { status: 302 });
    stubFetch(noLocation);
    const response = await safeFetch("https://example.com/a", {}, publicResolver);
    expect(response).toBe(noLocation);
  });

  it("returns a 304 that has no Location header", async () => {
    const notModified = new Response(null, { status: 304 });
    const fetchMock = stubFetch(notModified);
    const response = await safeFetch("https://example.com/a", {}, publicResolver);
    expect(response.status).toBe(304);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows exactly 5 redirects", async () => {
    const final = new Response("end");
    const fetchMock = stubFetch(
      ...Array.from({ length: 5 }, (_, i) => redirect(`/r${i + 1}`)),
      final
    );
    const response = await safeFetch("https://example.com/", {}, publicResolver);
    expect(response).toBe(final);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("throws after more than 5 redirects", async () => {
    const fetchMock = vi.fn(async () => redirect("/again"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      safeFetch("https://example.com/", {}, publicResolver)
    ).rejects.toThrow(/too many redirects/i);
    await expect(
      safeFetch("https://example.com/", {}, publicResolver)
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).toHaveBeenCalledTimes(12);
  });
});
