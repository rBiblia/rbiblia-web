<?php

declare(strict_types=1);

namespace rBibliaWeb\Value;

class About
{
    /** @var string */
    private $language;

    /** @var bool */
    private $authorised;

    /** @var string */
    private $name;

    /** @var string */
    private $description;

    /** @var string */
    private $shortname;

    /** @var string */
    private $date;

    /** @var string */
    private $hash;

    /** @var string */
    private $file;

    public function __construct(
        string $file,
        string $hash,
        string $name,
        string $shortname,
        string $language,
        string $description = '',
        bool $authorised = false,
        string $date = ''
    ) {
        $this->file = $file;
        $this->hash = $hash;
        $this->name = $name;
        $this->shortname = $shortname;
        $this->language = $language;
        $this->description = $description;
        $this->authorised = $authorised;
        $this->date = $date;
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
        return strtolower(pathinfo($this->file, PATHINFO_FILENAME));
    }
}
