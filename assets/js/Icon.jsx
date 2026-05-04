import React from "react";
import PropTypes from "prop-types";

export default function Icon({
    name,
    size = 24,
    className = "",
    title,
    ...props
}) {
    const spriteHref = `/assets/icons/sprite.svg#${name}`;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={title ? undefined : "true"}
            {...props}
        >
            {title && <title>{title}</title>}
            <use href={spriteHref} />
        </svg>
    );
}

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    className: PropTypes.string,
    title: PropTypes.string,
};
