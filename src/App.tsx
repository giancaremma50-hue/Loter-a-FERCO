import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import PlayerBoard from "./pages/PlayerBoard";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/unirse/:code" element={<JoinRoom />} />
        <Route path="/sala/:code" element={<PlayerBoard />} />
        <Route path="/sala/:code/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
