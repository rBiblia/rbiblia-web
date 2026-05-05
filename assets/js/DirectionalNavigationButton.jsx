import clsx from "clsx";
import React from "react";
import PropTypes from "prop-types";
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

DirectionalNavigationButton.propTypes = {
    direction: PropTypes.oneOf(["left", "right"]).isRequired,
    disabled: PropTypes.bool,
};

export default DirectionalNavigationButton;
