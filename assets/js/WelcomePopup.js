import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import useFocusTrap from "./hooks/useFocusTrap";
import {
    safeLocalStorageGetItem,
    safeLocalStorageRemoveItem,
    safeLocalStorageSetItem,
} from "./safeStorage";

const WELCOME_POPUP_DISABLED_KEY = "rbiblia_disable_welcome_popup";
const DESKTOP_DOWNLOAD_URL = "https://api.toborek.info/download/rbib261.exe";

const isWelcomePopupDisabled = () =>
    safeLocalStorageGetItem(WELCOME_POPUP_DISABLED_KEY) === "1";

const setWelcomePopupDisabled = (disabled) => {
    if (disabled) {
        safeLocalStorageSetItem(WELCOME_POPUP_DISABLED_KEY, "1");
        return;
    }
    safeLocalStorageRemoveItem(WELCOME_POPUP_DISABLED_KEY);
};

const WelcomePopup = ({ isOpen, onClose }) => {
    const [dontShowAgain, setDontShowAgain] = useState(isWelcomePopupDisabled);
    const popupRef = useFocusTrap(isOpen, onClose);

    useEffect(() => {
        if (isOpen) {
            setDontShowAgain(isWelcomePopupDisabled());
        }
    }, [isOpen]);

    const handleToggleDontShow = (e) => {
        const value = e.target.checked;
        setDontShowAgain(value);
        setWelcomePopupDisabled(value);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions */}
            <div className="welcome-popup-overlay" onClick={onClose} />
            <dialog
                ref={popupRef}
                className="welcome-popup-modal"
                open
            >
                <h3 className="welcome-popup-title">Witamy w rBiblia Web</h3>
                <p className="welcome-popup-text">
                    Przeglądasz właśnie webową wersję aplikacji rBiblia. Wersja
                    przeglądarkowa zapewnia szybki dostęp do treści, jednak
                    pełny zestaw możliwości programu dostępny jest w wydaniu
                    desktopowym.
                </p>
                <p className="welcome-popup-text">
                    Aby korzystać ze wszystkich funkcji rBiblia, zachęcamy do
                    pobrania wersji komputerowej.
                </p>

                <label className="welcome-popup-checkbox">
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={handleToggleDontShow}
                    />
                    <span>Nie pokazuj tego komunikatu ponownie</span>
                </label>

                <div className="welcome-popup-actions">
                    <a
                        className="welcome-popup-btn welcome-popup-download"
                        href={DESKTOP_DOWNLOAD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Pobierz
                    </a>
                    <button
                        type="button"
                        className="welcome-popup-btn welcome-popup-close"
                        onClick={onClose}
                    >
                        Zamknij
                    </button>
                </div>
            </dialog>
        </>
    );
};

WelcomePopup.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export { isWelcomePopupDisabled };
export default WelcomePopup;
