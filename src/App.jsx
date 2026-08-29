import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import KrishiShayakDashboard from "./KrishiShayakDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<KrishiShayakDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;