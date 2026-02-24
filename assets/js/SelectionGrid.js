import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { getSigla } from "./bookSigla";

const SelectionGrid = ({
    books,
    structure,
    onSelectChapter,
    initialBook = null,
    currentBook = null, // Currently active book to highlight
    currentChapter = null, // Currently active chapter to highlight
    onClose,
}) => {
    const { formatMessage, locale } = useIntl();
    const [view, setView] = useState(initialBook ? "chapters" : "books");
    const [selectedBook, setSelectedBook] = useState(initialBook);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Update isMobile on window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /**
     * Get display name for a book - full name on desktop, sigla on mobile
     */
    const getBookDisplayName = (bookId) => {
        if (isMobile) {
            return getSigla(bookId, locale);
        }
        return books[bookId]?.name || bookId;
    };

    if (!structure || !books) return null;

    const otBooks = Object.keys(structure).filter(
        (id) => books[id] && books[id].group === "ot"
    );
    const dcBooks = Object.keys(structure).filter(
        (id) => books[id] && books[id].group === "dc"
    );
    const ntBooks = Object.keys(structure).filter(
        (id) => books[id] && books[id].group === "nt"
    );
    const otherBooks = Object.keys(structure).filter(
        (id) =>
            books[id] &&
            books[id].group !== "ot" &&
            books[id].group !== "nt" &&
            books[id].group !== "dc"
    );

    const handleBookClick = (bookId) => {
        setSelectedBook(bookId);
        setView("chapters");
    };

    const handleChapterClick = (chapter) => {
        onSelectChapter(selectedBook, chapter);
        onClose();
    };

    const renderBookGrid = (bookIds, titleId) => {
        if (bookIds.length === 0) return null;
        return (
            <div className="selection-section mb-4">
                <h3 className="section-title mb-3">
                    {formatMessage({ id: titleId })}
                </h3>
                <div className="grid-container">
                    {bookIds.map((id) => (
                        <div
                            key={id}
                            className={`tile book-tile ${
                                isMobile ? "tile-compact" : ""
                            } ${id === currentBook ? "tile-active" : ""}`}
                            onClick={() => handleBookClick(id)}
                            title={books[id].name}
                        >
                            <span className="tile-text">
                                {getBookDisplayName(id)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="selection-overlay">
            <div className="selection-content container">
                <div className="selection-header d-flex justify-content-between align-items-center mb-4 pt-4">
                    <h2>
                        {view === "books"
                            ? formatMessage({ id: "selectBook" })
                            : `${books[selectedBook].name} - ${formatMessage({
                                  id: "selectChapter",
                              })}`}
                    </h2>
                    <div className="d-flex gap-2">
                        {view === "chapters" && (
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => setView("books")}
                            >
                                {formatMessage({ id: "backToBooks" })}
                            </button>
                        )}
                        <button
                            className="btn btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                </div>

                <div className="selection-body pb-5">
                    {view === "books" ? (
                        <>
                            {renderBookGrid(otBooks, "oldTestament")}
                            {renderBookGrid(dcBooks, "deuterocanonicalBooks")}
                            {renderBookGrid(ntBooks, "newTestament")}
                            {renderBookGrid(otherBooks, "otherBooks")}
                        </>
                    ) : (
                        <div className="grid-container chapters-grid">
                            {structure[selectedBook].map((chapter) => (
                                <div
                                    key={chapter}
                                    className={`tile chapter-tile ${
                                        selectedBook === currentBook &&
                                        chapter === currentChapter
                                            ? "tile-active"
                                            : ""
                                    }`}
                                    onClick={() => handleChapterClick(chapter)}
                                >
                                    <span className="tile-text">{chapter}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectionGrid;
