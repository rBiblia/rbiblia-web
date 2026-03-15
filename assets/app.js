import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/open-sans";
import "bootstrap/scss/bootstrap.scss";
import "./scss/app.scss";
import AppWithIntlProvider from "./AppWithIntlProvider";
import migrateOldNotes from "./js/migrateOldNotes";

// One-time migration of legacy notes format
try {
    migrateOldNotes();
} catch (err) {
    // Non-critical: migration failure must not block UI startup
    console.warn("[rBiblia] Notes migration skipped:", err);
}

const container = document.getElementById("root");
if (!container) {
    console.error('[rBiblia] Missing "#root" container, cannot mount UI.');
} else {
    const root = createRoot(container);
    root.render(<AppWithIntlProvider />);
}
