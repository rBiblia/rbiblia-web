<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

class About
{
    public function __construct(
        private readonly string $file,
        private readonly string $hash,
        private readonly string $name,
        private readonly string $shortname,
        private readonly string $language,
        private readonly string $description = '',
        private readonly bool $authorised = false,
        private readonly string $date = ''
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
