import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"

type LoggedInUser = {
  id: number
  username: string
  role: string | null
  email_address: string
  status: string
  last_login?: string | null
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onClick = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append("username", username)
      formData.append("password", password)

      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      })

      const user: LoggedInUser = await res.json()

      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(user))

      // Role-based redirect
      const role = (user.role || "").toUpperCase()
      switch (role) {
        case "PLATFORM":
          navigate("/pm/dashboard")
          break
        case "ADMIN":
          navigate("/ua/dashboard")
          break
        case "CSR":
          navigate(`/csr/dashboard/user?id=${user.id}`)
          break
        case "PIN":
          navigate(`/pin/dashboard/user?id=${user.id}`)
          break
        default:
          navigate("/dashboard")
          break
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 min-h-screen",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl p-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Login</CardTitle>
          <CardDescription className="text-center text-base">
            Enter your username below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="button"
                onClick={onClick}
                className="w-full text-base py-2.5"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full text-base py-2.5"
                onClick={() => alert("Hook up Google OAuth here")}
              >
                Login with Google
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
