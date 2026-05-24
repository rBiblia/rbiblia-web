<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

readonly class Report
{
    private string $name;

    private string $email;

    private string $notes;

    private string $content;

    private string $originalContent;

    private string $translation;

    private string $book;

    private string $chapter;

    private string $verse;

    public function __construct(array $data)
    {
        $this->name = $data['name'];
        $this->email = $data['email'];
        $this->notes = $data['notes'];
        $this->content = $data['content'];
        $this->originalContent = $data['original_content'];
        $this->translation = $data['translation'];
        $this->book = $data['book'];
        $this->chapter = (string)$data['chapter'];
        $this->verse = (string)$data['verse'];
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getNotes(): string
    {
        return nl2br($this->notes);
    }

    public function getContent(): string
    {
        return nl2br($this->content);
    }

    public function getTranslation(): string
    {
        return $this->translation;
    }

    public function getBook(): string
    {
        return $this->book;
    }

    public function getChapter(): string
    {
        return $this->chapter;
    }

    public function getVerse(): string
    {
        return $this->verse;
    }

    public function getOriginalContent(): string
    {
        return $this->originalContent;
    }

    public function getIP(): string
    {
        $httpXForwardedFor = getenv('HTTP_X_FORWARDED_FOR');

        if (empty($httpXForwardedFor)) {
            return (string)getenv('REMOTE_ADDR');
        }

        return (string)$httpXForwardedFor;
    }
}
