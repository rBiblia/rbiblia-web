import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IntlProvider } from "react-intl";
import VerseActionsModal from "../../assets/js/VerseActionsModal";

// Mock hooks and components
vi.mock("../../assets/js/hooks/useFocusTrap", () => ({
    default: vi.fn().mockReturnValue({ current: null }),
}));

vi.mock("../../assets/js/Icon", () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

const messages = {
    close: "Zamknij",
    verseActions: "Opcje wersetu",
    reportTranslationError: "Zgłoś błąd w tłumaczeniu",
    editNote: "Edytuj notatkę",
    addNote: "Dodaj notatkę",
    compareVerse: "Porównaj werset",
    errorReportType: "Typ błędu",
    errorReportTypo: "Literówka / błąd ortograficzny",
    errorReportInaccuracy: "Niewierność tłumaczenia",
    errorReportPunctuation: "Interpunkcja",
    errorReportMissingWords: "Brakujące słowa",
    errorReportOther: "Inne",
    errorReportDescription: "Opis błędu / sugerowana poprawka",
    errorReportDescriptionPlaceholder: "Wpisz szczegóły błędu...",
    errorReportSubmit: "Wyślij zgłoszenie",
    errorReportSuccessTitle: "Dziękujemy!",
    errorReportSuccess: "Dziękujemy! Zgłoszenie zostało zapisane.",
    errorReportCopy: "Skopiuj zgłoszenie",
    errorReportCopied: "Skopiowano!",
    errorReportCancel: "Anuluj",
    errorReportDescriptionRequired: "Opis błędu jest wymagany.",
    errorReportTypeRequired: "Wybierz typ błędu.",
};

const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="pl" messages={messages}>
            {component}
        </IntlProvider>
    );
};

describe("VerseActionsModal", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        bookId: "gen",
        chapterId: 1,
        verseId: "1",
        bookName: "Księga Rodzaju",
        translationId: "pl-ubg",
        translationName: "Uwspółcześniona Biblia Gdańska",
        verseContent: "Na początku Bóg stworzył niebo i ziemię.",
        hasNote: false,
        onAction: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        
        // Mock clipboard
        Object.defineProperty(navigator, "clipboard", {
            value: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
            configurable: true,
            writable: true,
        });
    });

    it("does not render if isOpen is false", () => {
        const { container } = renderWithIntl(
            <VerseActionsModal {...defaultProps} isOpen={false} />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders options menu and verse preview when open", () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        expect(screen.getByText("Opcje wersetu: Księga Rodzaju 1:1")).toBeInTheDocument();
        expect(screen.getByText('"Na początku Bóg stworzył niebo i ziemię."')).toBeInTheDocument();
        expect(screen.getByText("Porównaj werset")).toBeInTheDocument();
        expect(screen.getByText("Dodaj notatkę")).toBeInTheDocument();
        expect(screen.getByText("Zgłoś błąd w tłumaczeniu")).toBeInTheDocument();
    });

    it("renders 'Edytuj notatkę' if hasNote is true", () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} hasNote={true} />);
        expect(screen.getByText("Edytuj notatkę")).toBeInTheDocument();
    });

    it("triggers onAction('compare') when compare button is clicked", () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        const compareBtn = screen.getByText("Porównaj werset");
        fireEvent.click(compareBtn);
        
        expect(defaultProps.onAction).toHaveBeenCalledWith("compare");
    });

    it("triggers onAction('note') when note button is clicked", () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        const noteBtn = screen.getByText("Dodaj notatkę");
        fireEvent.click(noteBtn);
        
        expect(defaultProps.onAction).toHaveBeenCalledWith("note");
    });

    it("switches to report form view and goes back to menu", () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        const reportBtn = screen.getByText("Zgłoś błąd w tłumaczeniu");
        fireEvent.click(reportBtn);
        
        // Assert form fields are rendered
        expect(screen.getByText("Zgłoś błąd w tłumaczeniu: Księga Rodzaju 1:1")).toBeInTheDocument();
        expect(screen.getByText("Typ błędu")).toBeInTheDocument();
        expect(screen.getByText("Literówka / błąd ortograficzny")).toBeInTheDocument();
        expect(screen.getByText("Opis błędu / sugerowana poprawka")).toBeInTheDocument();
        
        // Click cancel to return to main menu
        const cancelBtn = screen.getByText("Anuluj");
        fireEvent.click(cancelBtn);
        
        expect(screen.getByText("Opcje wersetu: Księga Rodzaju 1:1")).toBeInTheDocument();
    });

    it("validates form fields", () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        // Go to report form
        fireEvent.click(screen.getByText("Zgłoś błąd w tłumaczeniu"));
        
        // Click submit without filling form
        const submitBtn = screen.getByText("Wyślij zgłoszenie");
        fireEvent.click(submitBtn);
        
        // Verify errors
        expect(screen.getByText("Wybierz typ błędu.")).toBeInTheDocument();
        expect(screen.getByText("Opis błędu jest wymagany.")).toBeInTheDocument();
    });

    it("saves report to localStorage and shows success view on submit", async () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        // Go to report form
        fireEvent.click(screen.getByText("Zgłoś błąd w tłumaczeniu"));
        
        // Select error type card
        const typoCard = screen.getByText("Literówka / błąd ortograficzny");
        fireEvent.click(typoCard);
        
        // Type description
        const textarea = screen.getByPlaceholderText("Wpisz szczegóły błędu...");
        fireEvent.change(textarea, { target: { value: "Zły wyraz w zdaniu" } });
        
        // Click submit
        const submitBtn = screen.getByText("Wyślij zgłoszenie");
        fireEvent.click(submitBtn);
        
        // Assert success view
        expect(screen.getByText("Dziękujemy! Zgłoszenie zostało zapisane.")).toBeInTheDocument();
        
        // Assert local storage holds the report
        const reportsStr = localStorage.getItem("rbiblia-translation-reports");
        expect(reportsStr).toBeTruthy();
        const reports = JSON.parse(reportsStr);
        expect(reports.length).toBe(1);
        expect(reports[0]).toMatchObject({
            bookId: "gen",
            chapterId: 1,
            verseId: "1",
            errorType: "typo",
            description: "Zły wyraz w zdaniu",
            translationId: "pl-ubg",
        });
    });

    it("allows copying report to clipboard", async () => {
        renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        // Go to report form, fill, submit
        fireEvent.click(screen.getByText("Zgłoś błąd w tłumaczeniu"));
        fireEvent.click(screen.getByText("Literówka / błąd ortograficzny"));
        fireEvent.change(screen.getByPlaceholderText("Wpisz szczegóły błędu..."), { target: { value: "Zły wyraz" } });
        fireEvent.click(screen.getByText("Wyślij zgłoszenie"));
        
        const copyBtn = screen.getByText("Skopiuj zgłoszenie");
        fireEvent.click(copyBtn);
        
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        const callArg = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
        expect(callArg).toContain("Uwspółcześniona Biblia Gdańska");
        expect(callArg).toContain("Księga Rodzaju 1:1");
        expect(callArg).toContain("Zły wyraz");
        
        // Verify copy text changes to "Skopiowano!"
        await waitFor(() => {
            expect(screen.getByText("Skopiowano!")).toBeInTheDocument();
        });
    });
});
