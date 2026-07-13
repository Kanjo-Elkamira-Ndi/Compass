import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import LandingPage from "./pages/public/LandingPage";
import DevComponentsPage from "./pages/dev/DevComponentsPage";
import DevAppShellPage from "./pages/dev/DevAppShellPage";

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

      {/* Dev routes — excluded from sitemap, not production */}
      <Route path="/dev/components" element={<DevComponentsPage />} />
      <Route path="/dev/app-shell" element={<DevAppShellPage />} />
    </Routes>
  );
}

export default App;
