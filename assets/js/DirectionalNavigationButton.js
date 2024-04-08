import clsx from "clsx";
import React from "react";

function DirectionalNavigationButton({ direction, disabled, ...restProps }) {
    const className = clsx(
        "icon-navigator",
        direction === "left" && "icon-navigator-left",
        direction === "right" && "icon-navigator-right",
        disabled && "icon-navigator-disabled"
    );

    return (
        <button
            {...restProps}
            disabled={disabled}
            className={className}
        ></button>
    );
}

export default DirectionalNavigationButton;
