import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

function Main() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

const el = document.getElementById("root") ?? document.body.appendChild(document.createElement("div"));
const root = createRoot(el as HTMLElement);
root.render(<Main />);
