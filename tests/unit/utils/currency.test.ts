import { formatIDR } from "@/lib/utils/currency";

describe("currency utils", () => {
  it("formats positive number to IDR currency", () => {
    expect(formatIDR(125000)).toContain("125.000");
  });

  it("formats zero value", () => {
    expect(formatIDR(0)).toContain("0");
  });
});
