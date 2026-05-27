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
    default: ({ name, className }) => <span data-testid={`icon-${name}`} className={className}>{name}</span>,
}));

const messages = {
    close: "Zamknij",
    verseActions: "Opcje wersetu",
    reportTranslationError: "Zgłoś błąd w tłumaczeniu",
    editNote: "Edytuj notatkę",
    addNote: "Dodaj notatkę",
    compareVerse: "Porównaj werset",
    errorReportSubmit: "Wyślij zgłoszenie",
    errorReportSuccessTitle: "Dziękujemy!",
    errorReportSuccess: "Dziękujemy! Zgłoszenie zostało zapisane.",
    errorReportCopy: "Skopiuj zgłoszenie",
    errorReportCopied: "Skopiowano!",
    errorReportCancel: "Anuluj",
    errorReportName: "Imię",
    errorReportEmail: "E-mail",
    errorReportNotes: "Opis błędu / komentarz",
    errorReportContent: "Proponowana poprawka (edytuj poniższy tekst)",
    errorReportNameRequired: "Imię jest wymagane.",
    errorReportEmailRequired: "Adres e-mail jest wymagany.",
    errorReportEmailInvalid: "Wpisz poprawny adres e-mail.",
    errorReportContentRequired: "Treść wersetu jest wymagana.",
    errorReportSending: "Wysyłanie...",
    errorReportFailed: "Nie udało się wysłać zgłoszenia. Sprawdź połączenie lub skopiuj raport do schowka.",
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

        // Mock fetch
        globalThis.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
        expect(screen.getByLabelText("Imię")).toBeInTheDocument();
        expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
        expect(screen.getByLabelText("Proponowana poprawka (edytuj poniższy tekst)")).toBeInTheDocument();
        expect(screen.getByLabelText("Opis błędu / komentarz")).toBeInTheDocument();
        
        // Click cancel to return to main menu
        const cancelBtn = screen.getByText("Anuluj");
        fireEvent.click(cancelBtn);
        
        expect(screen.getByText("Opcje wersetu: Księga Rodzaju 1:1")).toBeInTheDocument();
    });

    it("validates form fields", async () => {
        const { container } = renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        // Go to report form
        fireEvent.click(screen.getByText("Zgłoś błąd w tłumaczeniu"));
        
        // Clear content (which is prefilled)
        fireEvent.change(screen.getByLabelText("Proponowana poprawka (edytuj poniższy tekst)"), {
            target: { value: "" },
        });

        // Submit form directly
        const form = container.querySelector("form");
        fireEvent.submit(form);
        
        // Verify errors
        await waitFor(() => {
            expect(screen.getByText("Imię jest wymagane.")).toBeInTheDocument();
            expect(screen.getByText("Adres e-mail jest wymagany.")).toBeInTheDocument();
            expect(screen.getByText("Treść wersetu jest wymagana.")).toBeInTheDocument();
        });

        // Fill invalid email - query fresh inputs from screen to avoid detached elements
        fireEvent.change(screen.getByLabelText("Imię"), { target: { value: "Rafal" } });
        fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalid-email" } });
        fireEvent.change(screen.getByLabelText("Proponowana poprawka (edytuj poniższy tekst)"), {
            target: { value: "Jakis tekst" },
        });
        
        // Wait for the clear errors to propagate
        await waitFor(() => {
            expect(screen.queryByText("Imię jest wymagane.")).not.toBeInTheDocument();
            expect(screen.queryByText("Adres e-mail jest wymagany.")).not.toBeInTheDocument();
            expect(screen.queryByText("Treść wersetu jest wymagana.")).not.toBeInTheDocument();
        });

        // Submit form again
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText("Wpisz poprawny adres e-mail.")).toBeInTheDocument();
        });
    });

    it("saves report to localStorage, sends POST request, and shows success view on submit", async () => {
        vi.mocked(globalThis.fetch).mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({ status: "success" })),
        });

        const { container } = renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        // Go to report form
        fireEvent.click(screen.getByText("Zgłoś błąd w tłumaczeniu"));
        
        // Fill form fields
        fireEvent.change(screen.getByLabelText("Imię"), { target: { value: "Rafaello" } });
        fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "email@address.pl" } });
        fireEvent.change(screen.getByLabelText("Proponowana poprawka (edytuj poniższy tekst)"), {
            target: { value: "fixed verse content" },
        });
        fireEvent.change(screen.getByLabelText("Opis błędu / komentarz"), {
            target: { value: "here are my notes" },
        });
        
        // Submit form directly
        const form = container.querySelector("form");
        fireEvent.submit(form);
        
        // Assert success view
        await waitFor(() => {
            expect(screen.getByText("Dziękujemy! Zgłoszenie zostało zapisane.")).toBeInTheDocument();
        });

        // Assert fetch was called with the correct payload
        expect(globalThis.fetch).toHaveBeenCalledWith("/api/pl/report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Rafaello",
                email: "email@address.pl",
                notes: "here are my notes",
                content: "fixed verse content",
                original_content: "Na początku Bóg stworzył niebo i ziemię.",
                translation: "pl-ubg",
                book: "gen",
                chapter: 1,
                verse: 1,
            }),
        });
        
        // Assert local storage holds the report
        const reportsStr = localStorage.getItem("rbiblia-translation-reports");
        expect(reportsStr).toBeTruthy();
        const reports = JSON.parse(reportsStr);
        expect(reports.length).toBe(1);
        expect(reports[0]).toMatchObject({
            bookId: "gen",
            chapterId: 1,
            verseId: "1",
            name: "Rafaello",
            email: "email@address.pl",
            content: "fixed verse content",
            notes: "here are my notes",
            translationId: "pl-ubg",
        });

        // Assert name and email are persisted in localStorage
        expect(localStorage.getItem("rbiblia-report-name")).toBe("Rafaello");
        expect(localStorage.getItem("rbiblia-report-email")).toBe("email@address.pl");
    });

    it("allows copying report to clipboard", async () => {
        vi.mocked(globalThis.fetch).mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({ status: "success" })),
        });

        const { container } = renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        // Go to report form, fill, submit
        fireEvent.click(screen.getByText("Zgłoś błąd w tłumaczeniu"));
        fireEvent.change(screen.getByLabelText("Imię"), { target: { value: "Rafaello" } });
        fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "email@address.pl" } });
        fireEvent.change(screen.getByLabelText("Proponowana poprawka (edytuj poniższy tekst)"), {
            target: { value: "fixed verse content" },
        });
        fireEvent.change(screen.getByLabelText("Opis błędu / komentarz"), {
            target: { value: "here are my notes" },
        });
        
        const form = container.querySelector("form");
        fireEvent.submit(form);
        
        await waitFor(() => {
            expect(screen.getByText("Dziękujemy! Zgłoszenie zostało zapisane.")).toBeInTheDocument();
        });

        const copyBtn = screen.getByText("Skopiuj zgłoszenie");
        fireEvent.click(copyBtn);
        
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        const callArg = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
        expect(callArg).toContain("Uwspółcześniona Biblia Gdańska");
        expect(callArg).toContain("Księga Rodzaju 1:1");
        expect(callArg).toContain("fixed verse content");
        expect(callArg).toContain("here are my notes");
        
        // Verify copy text changes to "Skopiowano!"
        await waitFor(() => {
            expect(screen.getByText("Skopiowano!")).toBeInTheDocument();
        });
    });

    it("handles API failure by showing error message banner and allowing clipboard copy fallback", async () => {
        vi.mocked(globalThis.fetch).mockRejectedValue(new Error("Network Error"));

        const { container } = renderWithIntl(<VerseActionsModal {...defaultProps} />);
        
        // Go to report form, fill, submit
        fireEvent.click(screen.getByText("Zgłoś błąd w tłumaczeniu"));
        fireEvent.change(screen.getByLabelText("Imię"), { target: { value: "Rafaello" } });
        fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "email@address.pl" } });
        fireEvent.change(screen.getByLabelText("Proponowana poprawka (edytuj poniższy tekst)"), {
            target: { value: "fixed verse content" },
        });
        fireEvent.change(screen.getByLabelText("Opis błędu / komentarz"), {
            target: { value: "here are my notes" },
        });
        
        const form = container.querySelector("form");
        fireEvent.submit(form);
        
        // Assert error banner is rendered and we remain on the form view (not success view)
        await waitFor(() => {
            expect(screen.getByText("Nie udało się wysłać zgłoszenia. Sprawdź połączenie lub skopiuj raport do schowka. (Network Error)")).toBeInTheDocument();
        });
        expect(screen.queryByText("Dziękujemy! Zgłoszenie zostało zapisane.")).not.toBeInTheDocument();

        // Try copying report from the error fallback button
        const errorCopyBtn = screen.getByTitle("Skopiuj zgłoszenie");
        fireEvent.click(errorCopyBtn);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        const callArg = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
        expect(callArg).toContain("fixed verse content");
        expect(callArg).toContain("here are my notes");
    });
});
