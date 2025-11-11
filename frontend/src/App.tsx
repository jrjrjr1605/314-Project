import { Routes, Route } from "react-router-dom"
import { LoginForm } from "./components/login-form"
import UADashboard from "./components/UAdashboard"
import CreateUserAccount from "./components/create-user-account"
import PINDashboard from "./components/PINdashboard"
import RequestForm from "./components/PIN-request-form"
import CSRDashboard from "./components/CSRdashboard"
import CSRCompletedRequests from "./components/CSRCompletedRequests"
import Assignment from "./components/Assignment"
import PMDashboard from "./components/PMDashboard"
import PMWeeklyReport from "./components/PMWeeklyReport"
import PMDailyReport from "./components/PMDailyReport"
import PMMonthlyReport from "./components/PMMonthlyReport"
import UAUserProfiles from "./components/UAUserProfiles"
import PINCompletedRequests from "./components/PINCompletedRequests"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/ua/dashboard" element={<UADashboard />} />
      <Route path="/pin/dashboard/user" element={<PINDashboard />} />
      <Route path="/ua/create-user-account" element={<CreateUserAccount />} />
      <Route path="/pin/create-pin-request" element={<RequestForm />} />
      <Route path="/pin/completed-requests" element={<PINCompletedRequests />} />
      <Route path="/csr/dashboard/user" element={<CSRDashboard />} />
      <Route path="/csr/completed-requests" element={<CSRCompletedRequests />} />
      <Route path="/assignment" element={<Assignment />} />
      <Route path="/pm/dashboard" element={<PMDashboard />} />
      <Route path="/pm-weekly-report" element={<PMWeeklyReport />} />
      <Route path="/pm-daily-report" element={<PMDailyReport />} />
      <Route path="/pm-monthly-report" element={<PMMonthlyReport />} />
      <Route path="/ua/user-profiles" element={<UAUserProfiles />} />
    </Routes>
  )
}

export default App
