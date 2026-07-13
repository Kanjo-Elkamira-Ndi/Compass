import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import LandingPage from "./pages/public/LandingPage";

function App() {
  return (
    <Routes>
      {/* Public marketing routes */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
        }
      />

      {/* Placeholder route for smoke test */}
      <Route
        path="/placeholder"
        element={
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Hello Compass</h1>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
