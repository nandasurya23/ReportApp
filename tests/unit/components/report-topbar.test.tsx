/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";

import { ReportTopbar } from "@/components/report/report-topbar";

describe("ReportTopbar", () => {
  it("renders username and optional client badge", () => {
    render(<ReportTopbar username="pelunk" reportClientName="Client A" onLogout={jest.fn()} />);
    expect(screen.getByText("User: pelunk")).toBeInTheDocument();
    expect(screen.getByText("Client: Client A")).toBeInTheDocument();
  });

  it("hides client badge when client name is empty", () => {
    render(<ReportTopbar username="pelunk" reportClientName="   " onLogout={jest.fn()} />);
    expect(screen.getByText("User: pelunk")).toBeInTheDocument();
    expect(screen.queryByText(/Client:/)).not.toBeInTheDocument();
  });

  it("calls logout handler when button is clicked", () => {
    const onLogout = jest.fn();
    render(<ReportTopbar username="pelunk" reportClientName="Client A" onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: /keluar/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
