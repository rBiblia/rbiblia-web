import React from "react";
import { render } from "react-dom";
import "@fontsource/open-sans";
import "bootstrap/scss/bootstrap.scss";
import "./scss/app.scss";
import AppWithIntlProvider from "./AppWithIntlProvider";
import migrateOldNotes from "./js/migrateOldNotes";

// One-time migration of legacy notes format
migrateOldNotes();

render(<AppWithIntlProvider />, document.getElementById("root"));
