import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/open-sans";
import "bootstrap/scss/bootstrap.scss";
import "./scss/app.scss";
import AppWithIntlProvider from "./AppWithIntlProvider";
import migrateOldNotes from "./js/migrateOldNotes";

// One-time migration of legacy notes format
migrateOldNotes();

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<AppWithIntlProvider />);
