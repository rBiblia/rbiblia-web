import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import useFocusTrap from "./hooks/useFocusTrap";
import Icon from "./Icon";

const ERROR_TYPES = [
    { id: "typo", labelId: "errorReportTypo", defaultMessage: "Literówka / błąd ortograficzny" },
    { id: "inaccuracy", labelId: "errorReportInaccuracy", defaultMessage: "Niewierność tłumaczenia" },
    { id: "punctuation", labelId: "errorReportPunctuation", defaultMessage: "Interpunkcja" },
    { id: "missing_words", labelId: "errorReportMissingWords", defaultMessage: "Brakujące słowa" },
    { id: "other", labelId: "errorReportOther", defaultMessage: "Inne" },
];

export default function VerseActionsModal({
    isOpen,
    onClose,
    bookId,
    chapterId,
    verseId,
    bookName,
    translationId,
    translationName,
    verseContent,
    hasNote,
    onAction,
}) {
    const { formatMessage } = useIntl();
    const [view, setView] = useState("menu"); // "menu" | "report" | "success"
    const [errorType, setErrorType] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState({});
    const [copied, setCopied] = useState(false);
    const modalRef = useFocusTrap(isOpen, onClose);

    // Reset state when modal is opened/closed
    useEffect(() => {
        if (isOpen) {
            setView("menu");
            setErrorType("");
            setDescription("");
            setErrors({});
            setCopied(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleReportSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!errorType) {
            newErrors.type = formatMessage({
                id: "errorReportTypeRequired",
                defaultMessage: "Wybierz typ błędu.",
            });
        }
        if (!description.trim()) {
            newErrors.description = formatMessage({
                id: "errorReportDescriptionRequired",
                defaultMessage: "Opis błędu jest wymagany.",
            });
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Save report to localStorage
        const newReport = {
            id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            bookId,
            bookName,
            chapterId,
            verseId,
            translationId,
            translationName,
            errorType,
            description: description.trim(),
        };

        try {
            const reportsStr = localStorage.getItem("rbiblia-translation-reports");
            const reports = reportsStr ? JSON.parse(reportsStr) : [];
            reports.push(newReport);
            localStorage.setItem("rbiblia-translation-reports", JSON.stringify(reports));
        } catch (err) {
            console.error("Failed to save report to localStorage", err);
        }

        setView("success");
    };

    const getReportText = () => {
        const typeObj = ERROR_TYPES.find((t) => t.id === errorType);
        const typeLabel = typeObj
            ? formatMessage({ id: typeObj.labelId, defaultMessage: typeObj.defaultMessage })
            : errorType;
        return `[Zgłoszenie błędu w tłumaczeniu rBiblia]
Tłumaczenie: ${translationName || translationId}
Werset: ${bookName} ${chapterId}:${verseId}
Oryginalny tekst: "${verseContent}"
Typ błędu: ${typeLabel}
Opis/Sugerowana poprawka: ${description}`;
    };

    const handleCopyReport = () => {
        navigator.clipboard.writeText(getReportText()).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <>
            <div
                className={`verse-actions-overlay ${isOpen ? "active" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={modalRef}
                className={`verse-actions-modal ${isOpen ? "open" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="verse-actions-title"
            >
                <div className="verse-actions-header">
                    <h3 id="verse-actions-title" className="verse-actions-title">
                        {view === "menu" && (
                            <>
                                {formatMessage({ id: "verseActions", defaultMessage: "Opcje wersetu" })}: {bookName} {chapterId}:{verseId}
                            </>
                        )}
                        {view === "report" && (
                            <>
                                {formatMessage({ id: "reportTranslationError", defaultMessage: "Zgłoś błąd" })}: {bookName} {chapterId}:{verseId}
                            </>
                        )}
                        {view === "success" && (
                            <>
                                {formatMessage({ id: "errorReportSuccessTitle", defaultMessage: "Dziękujemy!" })}
                            </>
                        )}
                    </h3>
                    <button
                        className="verse-actions-close"
                        onClick={onClose}
                        aria-label={formatMessage({ id: "close" })}
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                <div className="verse-actions-body">
                    {view === "menu" && (
                        <>
                            {verseContent && (
                                <div className="verse-actions-verse-preview">
                                    "{verseContent.replaceAll("//", " ")}"
                                </div>
                            )}
                            <div className="verse-actions-menu">
                                <button
                                    className="verse-actions-btn verse-actions-btn-primary"
                                    onClick={() => onAction("compare")}
                                >
                                    <Icon name="search" size={18} className="me-2" />
                                    {formatMessage({ id: "compareVerse", defaultMessage: "Porównaj werset" })}
                                </button>
                                <button
                                    className="verse-actions-btn verse-actions-btn-primary"
                                    onClick={() => onAction("note")}
                                >
                                    <Icon name="square-pen" size={18} className="me-2" />
                                    {formatMessage({
                                        id: hasNote ? "editNote" : "addNote",
                                        defaultMessage: hasNote ? "Edytuj notatkę" : "Dodaj notatkę",
                                    })}
                                </button>
                                <button
                                    className="verse-actions-btn verse-actions-btn-danger"
                                    onClick={() => setView("report")}
                                >
                                    <Icon name="mail" size={18} className="me-2" />
                                    {formatMessage({
                                        id: "reportTranslationError",
                                        defaultMessage: "Zgłoś błąd w tłumaczeniu",
                                    })}
                                </button>
                            </div>
                        </>
                    )}

                    {view === "report" && (
                        <form onSubmit={handleReportSubmit} className="verse-actions-report-form">
                            {verseContent && (
                                <div className="verse-actions-verse-preview-small">
                                    <strong>{translationName || translationId}:</strong> "{verseContent.replaceAll("//", " ")}"
                                </div>
                            )}

                            <div className="verse-actions-form-group">
                                <label className="verse-actions-label">
                                    {formatMessage({ id: "errorReportType", defaultMessage: "Typ błędu" })}
                                </label>
                                <div className="verse-actions-radio-grid">
                                    {ERROR_TYPES.map((t) => (
                                        <label
                                            key={t.id}
                                            className={`verse-actions-radio-card ${
                                                errorType === t.id ? "active" : ""
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="errorType"
                                                value={t.id}
                                                checked={errorType === t.id}
                                                onChange={() => {
                                                    setErrorType(t.id);
                                                    if (errors.type) {
                                                        setErrors((prev) => ({ ...prev, type: null }));
                                                    }
                                                }}
                                                className="d-none"
                                            />
                                            <span className="radio-card-dot" />
                                            <span className="radio-card-text">
                                                {formatMessage({ id: t.labelId, defaultMessage: t.defaultMessage })}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.type && <div className="verse-actions-error-msg">{errors.type}</div>}
                            </div>

                            <div className="verse-actions-form-group">
                                <label className="verse-actions-label" htmlFor="error-description">
                                    {formatMessage({
                                        id: "errorReportDescription",
                                        defaultMessage: "Opis błędu / sugerowana poprawka",
                                    })}
                                </label>
                                <textarea
                                    id="error-description"
                                    className="verse-actions-textarea"
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        if (errors.description) {
                                            setErrors((prev) => ({ ...prev, description: null }));
                                        }
                                    }}
                                    placeholder={formatMessage({
                                        id: "errorReportDescriptionPlaceholder",
                                        defaultMessage: "Wpisz szczegóły błędu...",
                                    })}
                                    rows={4}
                                />
                                {errors.description && (
                                    <div className="verse-actions-error-msg">{errors.description}</div>
                                )}
                            </div>

                            <div className="verse-actions-form-actions">
                                <button
                                    type="button"
                                    className="verse-actions-btn-secondary"
                                    onClick={() => setView("menu")}
                                >
                                    {formatMessage({ id: "errorReportCancel", defaultMessage: "Anuluj" })}
                                </button>
                                <button type="submit" className="verse-actions-btn-submit">
                                    {formatMessage({ id: "errorReportSubmit", defaultMessage: "Wyślij zgłoszenie" })}
                                </button>
                            </div>
                        </form>
                    )}

                    {view === "success" && (
                        <div className="verse-actions-success-view">
                            <div className="success-icon-wrap">
                                <svg
                                    className="success-tick"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 52 52"
                                >
                                    <circle
                                        className="success-tick-circle"
                                        cx="26"
                                        cy="26"
                                        r="25"
                                        fill="none"
                                    />
                                    <path
                                        className="success-tick-check"
                                        fill="none"
                                        d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                    />
                                </svg>
                            </div>
                            <p className="success-text">
                                {formatMessage({
                                    id: "errorReportSuccess",
                                    defaultMessage: "Dziękujemy! Zgłoszenie zostało zapisane.",
                                })}
                            </p>
                            <div className="success-actions">
                                <button className="verse-actions-btn-copy" onClick={handleCopyReport}>
                                    <Icon name="file-text" size={18} className="me-2" />
                                    {copied
                                        ? formatMessage({ id: "errorReportCopied", defaultMessage: "Skopiowano!" })
                                        : formatMessage({ id: "errorReportCopy", defaultMessage: "Skopiuj zgłoszenie" })}
                                </button>
                                <button className="verse-actions-btn-close-success" onClick={onClose}>
                                    {formatMessage({ id: "close", defaultMessage: "Zamknij" })}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

VerseActionsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    bookId: PropTypes.string.isRequired,
    chapterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    verseId: PropTypes.string.isRequired,
    bookName: PropTypes.string,
    translationId: PropTypes.string,
    translationName: PropTypes.string,
    verseContent: PropTypes.string,
    hasNote: PropTypes.bool,
    onAction: PropTypes.func.isRequired,
};
