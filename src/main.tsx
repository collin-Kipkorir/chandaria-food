import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { BrowserRouter } from "react-router-dom";
import Root from "./Root";

function Main() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}

const el = document.getElementById("root") ?? document.body.appendChild(document.createElement("div"));
const root = createRoot(el as HTMLElement);
root.render(<Main />);
