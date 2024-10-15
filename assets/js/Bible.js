import React, { useCallback, useEffect, useRef, useState } from "react";
import Navigator from "./Navigator";
import Reader from "./Reader";
import StatusBar from "./StatusBar";
import { injectIntl } from "react-intl";
import getDataFromCurrentPathname from "./getDataFromCurrentPathname";
import AppError from "./AppError";
import AppLoading from "./AppLoading";
import updateHistory from "./updateHistory";
import getAppropriateBook from "./getAppropriateBook";

const Bible = ({ intl, setLocale }) => {
    const [error, setError] = useState(null);
    const [isBooksLoading, setIsBooksLoading] = useState(true);
    const [isTranslationsLoading, setIsTranslationsLoading] = useState(true);
    const [isStructureLoading, setIsStructureLoading] = useState(true);
    const [showVerses, setShowVerses] = useState(false);

    // Note: It contains all books available - not only translation specific
    const [books, setBooks] = useState([]);
    const [translations, setTranslations] = useState([]);
    const [structure, setStructure] = useState(null);
    const [verses, setVerses] = useState([]);
    const [selectedTranslation, setSelectedTranslation] = useState(
        getDataFromCurrentPathname().translation
    );
    const [selectedBook, setSelectedBook] = useState(
        getDataFromCurrentPathname().book
    );
    const [selectedChapter, setSelectedChapter] = useState(
        getDataFromCurrentPathname().chapter
    );

    const keepChapterIfPossible = useRef(false);
    const startFromLastVerse = useRef(false);

    const chapters =
        structure && selectedBook && structure[selectedBook]
            ? structure[selectedBook]
            : [];

    const changeSelectedTranslation = useCallback((newTranslation) => {
        setShowVerses(false);
        setIsStructureLoading(true);
        keepChapterIfPossible.current = true;
        setSelectedTranslation(newTranslation);
    }, []);

    const setLocaleAndUpdateHistory = (locale) => {
        const { chapter, book, translation } = getDataFromCurrentPathname();

        setLocale(locale);
        updateHistory(locale, translation, book, chapter);
    };

    const changeSelectedBook = (newSelectedBook) => {
        keepChapterIfPossible.current = newSelectedBook === selectedBook;
        setSelectedBook(newSelectedBook);
    };

    useEffect(() => {
        if (!structure || chapters.length === 0) {
            return;
        }
        changeSelectedChapter(
            getAppropriateChapter(
                keepChapterIfPossible.current,
                startFromLastVerse.current
            )
        );
        keepChapterIfPossible.current = false;
        startFromLastVerse.current = false;
    }, [selectedBook, structure]);

    const getAppropriateChapter = (
        keepChapterIfPossible,
        startFromLastVerse
    ) => {
        if (
            keepChapterIfPossible &&
            structure[selectedBook].some(
                (chapter) => chapter == selectedChapter
            )
        ) {
            return selectedChapter;
        }

        if (startFromLastVerse) {
            return structure[selectedBook][structure[selectedBook].length - 1];
        }

        return structure[selectedBook][0];
    };

    const changeSelectedChapter = (newSelectedChapter) => {
        const { locale } = intl;

        updateHistory(
            locale,
            selectedTranslation,
            selectedBook,
            newSelectedChapter
        );

        setShowVerses(false);

        fetch(
            "/api/" +
                locale +
                "/translation/" +
                selectedTranslation +
                "/book/" +
                selectedBook +
                "/chapter/" +
                newSelectedChapter
        )
            .then((res) => res.json())
            .then(
                (result) => {
                    setSelectedChapter(newSelectedChapter);
                    setShowVerses(true);
                    setVerses(result.data);
                },
                (error) => {
                    setError(error);
                }
            );
    };

    const loadTranslationsAndBooks = () => {
        const { locale } = intl;

        setIsTranslationsLoading(true);
        setIsBooksLoading(true);

        Promise.all([
            fetch(`/api/${locale}/translation`)
                .then((res) => res.json())
                .then(
                    (result) => {
                        setTranslations(result.data);
                    },
                    (error) => {
                        setError(error);
                    }
                )
                .finally(() => {
                    setIsTranslationsLoading(false);
                }),
            fetch(`/api/${locale}/book`)
                .then((res) => res.json())
                .then(
                    (result) => {
                        setBooks(result.data);
                    },
                    (error) => {
                        setError(error);
                    }
                )
                .finally(() => {
                    setIsBooksLoading(false);
                }),
        ]);
    };

    useEffect(() => {
        if (!isBooksLoading && !isTranslationsLoading) {
            changeSelectedTranslation(selectedTranslation);
        }
    }, [isBooksLoading, isTranslationsLoading]);

    useEffect(() => {
        loadTranslationsAndBooks();
    }, [intl.locale]); // Added dependencies based on variables used inside useEffect.
    // Other useEffect hooks as needed for componentDidUpdate logic

    // Note: parseInt is here because sometimes selectedChapter is a string.
    //    Probably when chapter is parsed from the URL during first load it become a string
    const getChapterIndex = () =>
        chapters.findIndex((value) => value === parseInt(selectedChapter));

    const isNextChapterAvailable = () =>
        !isStructureLoading &&
        typeof chapters[getChapterIndex() + 1] !== "undefined";

    const isPrevChapterAvailable = () => {
        return !isStructureLoading && getChapterIndex() !== 0;
    };

    const getBookIndex = () =>
        Object.keys(structure).findIndex((bookKey) => bookKey === selectedBook);

    const isNextBookAvailable = () => {
        return (
            !isStructureLoading &&
            typeof structure[Object.keys(structure)[getBookIndex() + 1]] !==
                "undefined"
        );
    };

    const isPrevBookAvailable = () => {
        return !isStructureLoading && getBookIndex() !== 0;
    };

    const nextChapter = () => {
        if (isNextChapterAvailable()) {
            changeSelectedChapter(chapters[getChapterIndex() + 1]);
            return;
        }
        nextBook();
    };

    const prevChapter = () => {
        if (isPrevChapterAvailable()) {
            changeSelectedChapter(chapters[getChapterIndex() - 1]);
            return;
        }

        prevBook(true);
    };

    const nextBook = () => {
        if (isNextBookAvailable()) {
            setSelectedBook();
            changeSelectedBook(Object.keys(structure)[getBookIndex() + 1]);
        }
    };

    const prevBook = (_startFromLastVerse = false) => {
        if (!isPrevBookAvailable()) {
            return;
        }
        startFromLastVerse.current = _startFromLastVerse;

        setSelectedBook(Object.keys(structure)[getBookIndex() - 1]);
    };

    useEffect(() => {
        if (startFromLastVerse.current) {
            startFromLastVerse.current = false;
        }
    }, [selectedBook]);

    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const response = await fetch(
                    `/api/${intl.locale}/translation/${selectedTranslation}`
                );
                if (!response.ok)
                    throw new Error("Network response was not ok.");
                const result = await response.json();
                setStructure(result.data);
                setSelectedBook((_selectedBook) =>
                    getAppropriateBook(result.data, _selectedBook)
                );
            } catch (error) {
                setError(error);
            } finally {
                setIsStructureLoading(false);
            }
        };
        if (!isBooksLoading && !isTranslationsLoading && !error) {
            fetchStructure();
        }
    }, [isBooksLoading, isTranslationsLoading, selectedTranslation]);

    // Render content
    if (error) {
        return <AppError message={error.message} />;
    }
    if (isTranslationsLoading || isBooksLoading) {
        return <AppLoading />;
    }

    return (
        <>
            <Navigator
                books={books}
                translations={translations}
                selectedTranslation={selectedTranslation}
                selectedChapter={selectedChapter}
                selectedBook={selectedBook}
                structure={structure}
                chapters={chapters}
                isStructureLoading={isStructureLoading}
                changeSelectedTranslation={changeSelectedTranslation}
                changeSelectedBook={changeSelectedBook}
                changeSelectedChapter={changeSelectedChapter}
                prevChapter={prevChapter}
                nextChapter={nextChapter}
                prevBook={prevBook}
                nextBook={nextBook}
                isPrevBookAvailable={isPrevBookAvailable}
                isNextBookAvailable={isNextBookAvailable}
                isPrevChapterAvailable={isPrevChapterAvailable}
                isNextChapterAvailable={isNextChapterAvailable}
            />
            <Reader
                showVerses={showVerses}
                selectedBook={selectedBook}
                selectedChapter={selectedChapter}
                verses={verses}
            />
            <StatusBar
                setLocaleAndUpdateHistory={setLocaleAndUpdateHistory}
                translations={translations}
            />
        </>
    );
};

export default injectIntl(Bible);
