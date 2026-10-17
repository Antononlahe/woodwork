import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Bench } from "./app/Bench";
import { Home } from "./app/Home";
import { Prep } from "./app/Prep";
import { PrintView } from "./app/Print";
import { SettingsProvider } from "./app/Settings";

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/p/:id/prep" element={<Prep />} />
          <Route path="/p/:id" element={<Bench />} />
          <Route path="/p/:id/print" element={<PrintView />} />
          <Route path="/local/prep" element={<Prep local />} />
          <Route path="/local" element={<Bench local />} />
          <Route path="/local/print" element={<PrintView local />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
