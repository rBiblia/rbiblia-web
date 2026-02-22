import clsx from "clsx";
import React from "react";
import Icon from "./Icon";

function DirectionalNavigationButton({ direction, disabled, ...restProps }) {
    const className = clsx(
        "icon-navigator",
        disabled && "icon-navigator-disabled"
    );

    return (
        <button {...restProps} disabled={disabled} className={className}>
            {direction === "left" && <Icon name="chevron-left" />}
            {direction === "right" && <Icon name="chevron-right" />}
        </button>
    );
}

export default DirectionalNavigationButton;
