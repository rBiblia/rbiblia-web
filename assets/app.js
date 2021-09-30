import React from "react";
import {render} from "react-dom";
import "@fontsource/open-sans";
import "bootstrap/scss/bootstrap.scss";
import "./scss/app.scss";

import Bible from "./js/Bible";

render(<Bible/>, document.getElementById("root"));
