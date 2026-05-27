import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import useFocusTrap from "./hooks/useFocusTrap";
import Icon from "./Icon";
import safeJsonParse from "./safeJsonParse";

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
    const { formatMessage, locale } = useIntl();
    const [view, setView] = useState("menu"); // "menu" | "report" | "success"
    const [name, setName] = useState(() => localStorage.getItem("rbiblia-report-name") || "");
    const [email, setEmail] = useState(() => localStorage.getItem("rbiblia-report-email") || "");
    const [content, setContent] = useState("");
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState({});
    const [copied, setCopied] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const modalRef = useFocusTrap(isOpen, onClose);

    // Reset state when modal is opened/closed or verse changes
    useEffect(() => {
        if (isOpen) {
            setView("menu");
            setContent(verseContent ? verseContent.replaceAll("//", " ") : "");
            setNotes("");
            setErrors({});
            setCopied(false);
            setIsSending(false);
            setSubmitError(null);
        }
    }, [isOpen, verseContent]);

    if (!isOpen) return null;

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = formatMessage({
                id: "errorReportNameRequired",
                defaultMessage: "Imię jest wymagane.",
            });
        }
        if (!email.trim()) {
            newErrors.email = formatMessage({
                id: "errorReportEmailRequired",
                defaultMessage: "Adres e-mail jest wymagany.",
            });
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = formatMessage({
                id: "errorReportEmailInvalid",
                defaultMessage: "Wpisz poprawny adres e-mail.",
            });
        }
        if (!content.trim()) {
            newErrors.content = formatMessage({
                id: "errorReportContentRequired",
                defaultMessage: "Treść wersetu jest wymagana.",
            });
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSending(true);
        setSubmitError(null);

        const parsedChapter = parseInt(chapterId, 10);
        const parsedVerse = parseInt(verseId, 10);

        const payload = {
            name: name.trim(),
            email: email.trim(),
            notes: notes.trim(),
            content: content.trim(),
            original_content: verseContent,
            translation: translationId,
            book: bookId,
            chapter: isNaN(parsedChapter) ? chapterId : parsedChapter,
            verse: isNaN(parsedVerse) ? verseId : parsedVerse,
        };

        // Save report to localStorage (both for fallback history & local tracking)
        const newReport = {
            id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            bookId,
            bookName,
            chapterId,
            verseId,
            translationId,
            translationName,
            ...payload,
        };

        try {
            const reportsStr = localStorage.getItem("rbiblia-translation-reports");
            const reports = reportsStr ? JSON.parse(reportsStr) : [];
            reports.push(newReport);
            localStorage.setItem("rbiblia-translation-reports", JSON.stringify(reports));
        } catch (err) {
            console.error("Failed to save report to localStorage", err);
        }

        try {
            const response = await fetch(`/api/${locale}/report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            await safeJsonParse(response);

            // Persist valid name & email in localStorage for future prefilling
            localStorage.setItem("rbiblia-report-name", name.trim());
            localStorage.setItem("rbiblia-report-email", email.trim());

            setView("success");
        } catch (err) {
            console.error("Failed to submit translation error report", err);
            const genericMsg = formatMessage({
                id: "errorReportFailed",
                defaultMessage: "Nie udało się wysłać zgłoszenia. Sprawdź połączenie lub skopiuj raport do schowka.",
            });
            setSubmitError(err.message ? `${genericMsg} (${err.message})` : genericMsg);
        } finally {
            setIsSending(false);
        }
    };

    const getReportText = () => {
        return `[Zgłoszenie błędu w tłumaczeniu rBiblia]
Tłumaczenie: ${translationName || translationId}
Werset: ${bookName} ${chapterId}:${verseId}
Oryginalny tekst: "${verseContent}"
Proponowana poprawka: "${content}"
Uwagi/Komentarz: ${notes}`;
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
                            {submitError && (
                                <div className="verse-actions-error-banner">
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                        <div className="d-flex align-items-center">
                                            <Icon name="alert-triangle" size={18} className="me-2 text-danger" />
                                            <span>{submitError}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-copy-error-fallback"
                                            onClick={handleCopyReport}
                                            title={formatMessage({ id: "errorReportCopy", defaultMessage: "Skopiuj zgłoszenie" })}
                                        >
                                            <Icon name={copied ? "check" : "file-text"} size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="verse-actions-form-group">
                                <label className="verse-actions-label" htmlFor="error-report-name">
                                    {formatMessage({ id: "errorReportName", defaultMessage: "Imię" })}
                                </label>
                                <input
                                    id="error-report-name"
                                    type="text"
                                    className="verse-actions-input"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) {
                                            setErrors((prev) => ({ ...prev, name: null }));
                                        }
                                    }}
                                    placeholder={formatMessage({ id: "errorReportName", defaultMessage: "Imię" })}
                                    disabled={isSending}
                                />
                                {errors.name && <div className="verse-actions-error-msg">{errors.name}</div>}
                            </div>

                            <div className="verse-actions-form-group">
                                <label className="verse-actions-label" htmlFor="error-report-email">
                                    {formatMessage({ id: "errorReportEmail", defaultMessage: "E-mail" })}
                                </label>
                                <input
                                    id="error-report-email"
                                    type="email"
                                    className="verse-actions-input"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) {
                                            setErrors((prev) => ({ ...prev, email: null }));
                                        }
                                    }}
                                    placeholder={formatMessage({ id: "errorReportEmail", defaultMessage: "E-mail" })}
                                    disabled={isSending}
                                />
                                {errors.email && <div className="verse-actions-error-msg">{errors.email}</div>}
                            </div>

                            <div className="verse-actions-form-group">
                                <label className="verse-actions-label" htmlFor="error-report-content">
                                    {formatMessage({ id: "errorReportContent", defaultMessage: "Proponowana poprawka (edytuj poniższy tekst)" })}
                                </label>
                                <textarea
                                    id="error-report-content"
                                    className="verse-actions-textarea"
                                    value={content}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        if (errors.content) {
                                            setErrors((prev) => ({ ...prev, content: null }));
                                        }
                                    }}
                                    rows={3}
                                    disabled={isSending}
                                />
                                {errors.content && <div className="verse-actions-error-msg">{errors.content}</div>}
                            </div>

                            <div className="verse-actions-form-group">
                                <label className="verse-actions-label" htmlFor="error-report-notes">
                                    {formatMessage({ id: "errorReportNotes", defaultMessage: "Opis błędu / komentarz" })}
                                </label>
                                <textarea
                                    id="error-report-notes"
                                    className="verse-actions-textarea"
                                    value={notes}
                                    onChange={(e) => {
                                        setNotes(e.target.value);
                                    }}
                                    placeholder={formatMessage({ id: "errorReportDescriptionPlaceholder", defaultMessage: "Wpisz szczegóły błędu..." })}
                                    rows={3}
                                    disabled={isSending}
                                />
                            </div>

                            <div className="verse-actions-form-actions">
                                <button
                                    type="button"
                                    className="verse-actions-btn-secondary"
                                    onClick={() => setView("menu")}
                                    disabled={isSending}
                                >
                                    {formatMessage({ id: "errorReportCancel", defaultMessage: "Anuluj" })}
                                </button>
                                <button type="submit" className="verse-actions-btn-submit" disabled={isSending}>
                                    {isSending ? (
                                        <>
                                            <span className="report-spinner me-2" />
                                            {formatMessage({ id: "errorReportSending", defaultMessage: "Wysyłanie..." })}
                                        </>
                                    ) : (
                                        formatMessage({ id: "errorReportSubmit", defaultMessage: "Wyślij zgłoszenie" })
                                    )}
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

