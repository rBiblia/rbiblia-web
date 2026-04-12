import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import PropTypes from "prop-types";
import useFocusTrap from "./hooks/useFocusTrap";
import Icon from "./Icon";

const AboutModal = ({ isOpen, onClose }) => {
    const { formatMessage } = useIntl();
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const modalRef = useFocusTrap(isOpen, onClose);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isActive = true;
        setIsLoading(true);
        setLoadError(null);

        const loadAbout = async () => {
            const paths = ["/assets/about.txt", "/assets/docs/about.txt"];
            let lastError = null;

            for (const path of paths) {
                try {
                    const response = await fetch(path);
                    if (!response.ok) {
                        lastError = new Error("Failed to load about");
                        continue;
                    }
                    return await response.text();
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error("Failed to load about");
        };

        loadAbout()
            .then((text) => {
                if (isActive) {
                    setContent(text);
                }
            })
            .catch(() => {
                if (isActive) {
                    setLoadError(
                        formatMessage({ id: "unexpectedErrorOccurred" })
                    );
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [isOpen, formatMessage]);

    return (
        <>
            <div
                className={`changelog-overlay ${isOpen ? "active" : ""}`}
                aria-hidden="true"
                onClick={onClose}
            />
            <div
                ref={modalRef}
                className={`changelog-modal ${isOpen ? "open" : ""}`}
            >
                <div className="changelog-header">
                    <h3 className="changelog-title">
                        {formatMessage({
                            id: "aboutTitle",
                            defaultMessage: "O programie",
                        })}
                    </h3>
                    <button
                        className="changelog-close"
                        onClick={onClose}
                        aria-label={formatMessage({ id: "close" })}
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="changelog-content">
                    {isLoading && <p>{formatMessage({ id: "loading" })}...</p>}
                    {!isLoading && loadError && <p>{loadError}</p>}
                    {!isLoading && !loadError && (
                        <pre className="changelog-pre">{content}</pre>
                    )}
                </div>
            </div>
        </>
    );
};

AboutModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default AboutModal;
