import React from "react";

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
            role={title ? "img" : undefined}
            {...props}
        >
            {title && <title>{title}</title>}
            <use href={spriteHref} />
        </svg>
    );
}
