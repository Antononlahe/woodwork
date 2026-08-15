import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Bench } from "./app/Bench";
import { Home } from "./app/Home";
import { PrintView } from "./app/Print";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/:id" element={<Bench />} />
        <Route path="/p/:id/print" element={<PrintView />} />
        <Route path="/local" element={<Bench local />} />
        <Route path="/local/print" element={<PrintView local />} />
      </Routes>
    </BrowserRouter>
  );
}
