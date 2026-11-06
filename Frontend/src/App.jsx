import { BrowserRouter } from "react-router-dom";
import WorkstationApp from "./workstation/WorkstationApp.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <WorkstationApp />
    </BrowserRouter>
  );
}
