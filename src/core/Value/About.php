<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

readonly class About
{
    public function __construct(
        private string $file,
        private string $hash,
        private string $name,
        private string $shortname,
        private string $language,
        private string $description = '',
        private bool $authorised = false,
        private string $date = ''
    ) {
    }

    public function getFile(): string
    {
        return $this->file;
    }

    public function getHash(): string
    {
        return $this->hash;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getShortname(): string
    {
        return $this->shortname;
    }

    public function getLanguage(): string
    {
        return $this->language;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getAuthorised(): bool
    {
        return $this->authorised;
    }

    public function getDate(): string
    {
        return $this->date;
    }

    public function getId(): string
    {
        return strtolower(pathinfo($this->file, \PATHINFO_FILENAME));
    }
}
