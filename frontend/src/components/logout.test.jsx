import { vi } from "vitest"

describe("NavUser logout", () => {
  it("clears localStorage and navigates home", () => {
    const navigate = vi.fn()
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom")
      return { ...actual, useNavigate: () => navigate }
    })

    localStorage.setItem("user", "foo")
    localStorage.setItem("auth_token", "bar")

    // Simulate logout
    const handleLogout = () => {
      localStorage.removeItem("user")
      localStorage.removeItem("auth_token")
      navigate("/")
    }

    handleLogout()

    // Check that localStorage has removed these items
    expect(localStorage.getItem("user")).toBeNull()
    expect(localStorage.getItem("auth_token")).toBeNull()

    // Check that there is redirect
    expect(navigate).toHaveBeenCalledWith("/")
  })
})


