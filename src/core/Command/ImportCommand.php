<?php

declare(strict_types=1);

namespace rBibliaWeb\Command;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;
use Doctrine\DBAL\ParameterType;
use Doctrine\DBAL\Schema\Table;
use rBibliaWeb\Value\About;
use rBibliaWeb\Value\Body;
use rBibliaWeb\Value\Translation;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class ImportCommand extends Command
{
    const TABLE_TRANSLATION = 'translation';
    const TABLE_DATA = 'data_%s';
    const TABLE_TEMP = 'temp';
    const ENTRY_TEMP_ID = '_%s';

    protected static $defaultName = 'import';

    private $settings = [];

    /** @var OutputInterface */
    private $output;

    /** @var Connection */
    private $db;

    public function __construct(array $settings = [])
    {
        $this->settings = $settings;

        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->setAliases(['i'])
            ->setDescription('Import *.bibx files into database')
            ->setHelp('Import given *.bibx files into database.')
            ->addOption('file', 'f', InputOption::VALUE_OPTIONAL, 'Import only specific *.bibx file, eg. <info>pl_bt5.bibx</info>')
            ->addOption('all', 'a', InputOption::VALUE_OPTIONAL, 'Import all *.bibx files', false)
            ->addOption('language', 'l', InputOption::VALUE_OPTIONAL, 'Import all files from a specific language group only, eg. <info>pl</info>', false)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $this->output = $output;

        if (false !== $input->getOption('all')) {
            $filesList = $this->getList();

            if (false !== $input->getOption('language')) {
                $inputLanguage = $input->getOption('language');

                if (null === $inputLanguage) {
                    return $this->displayError('No input language group given');
                }

                $filteredList = [];
                foreach ($filesList as $file) {
                    if (0 === strpos($file, sprintf('%s_', $inputLanguage))) {
                        $filteredList[] = $file;
                    }
                }
                $filesList = $filteredList;
            }

            return $this->importAll($filesList);
        }

        if ($input->hasOption('file')) {
            $inputFile = $input->getOption('file');

            if (null === $inputFile) {
                return $this->displayError('No input file given');
            }

            return $this->importFile($inputFile);
        }

        return Command::FAILURE;
    }

    private function importAll(array $fileList = []): int
    {
        $index = 0;

        foreach ($fileList as $file) {
            $this->output->writeln(sprintf('Progress: %d/%d', ++$index, \count($fileList)));

            $result = $this->importFile($file);

            if (Command::SUCCESS !== $result) {
                return Command::FAILURE;
            }
        }

        return Command::SUCCESS;
    }

    private function getList(): array
    {
        $bibxFolder = $this->settings['bibx_folder'];

        if ('/' !== substr($bibxFolder, -1)) {
            $bibxFolder .= '/';
        }

        $path = new \DirectoryIterator($bibxFolder);

        $list = [];

        foreach ($path as $fileinfo) {
            if ($fileinfo->isDot() || '.keep' === $fileinfo->getFilename() || 'dir' === $fileinfo->getType()) {
                continue;
            }

            $list[] = $fileinfo->getFilename();
        }

        return $list;
    }

    private function importFile($file): int
    {
        $filePath = $this->settings['bibx_folder'].'/'.$file;

        if (!file_exists($filePath)) {
            return $this->displayError(sprintf('Input file `%s` not exists', $filePath));
        }

        $content = '';

        try {
            $zh = gzopen($filePath, 'r');

            while ($line = gzgets($zh)) {
                $content .= $line;
            }

            gzclose($zh);
        } catch (\Exception $e) {
            $this->displayError(sprintf('Error occurred while reading XML file: %s', $e->getMessage()));
        }

        if (empty($content)) {
            $this->displayError(sprintf('No translation data found in: %s', $filePath));
        }

        $xml = simplexml_load_string($content);

        $about = new About(
            $file,
            md5_file($filePath),
            $xml->about->name->__toString(),
            $xml->about->shortname->__toString(),
            $xml->about->language->__toString(),
            $xml->about->description->__toString(),
            '1' === $xml->about->authorised->__toString() ? true : false,
            isset($xml->about->date) ? $xml->about->date->__toString() : ''
        );

        $body = new Body();

        foreach ($xml->translation as $book) {
            foreach ($book as $bookElement) {
                $bookId = $bookElement->attributes()['id']->__toString();

                foreach ($bookElement as $chapterElement) {
                    $chapterId = (int) $chapterElement->attributes()['id']->__toString();

                    foreach ($chapterElement as $verseElement) {
                        $verseId = (int) $verseElement->attributes()['id']->__toString();

                        $content = $verseElement->__toString();

                        $body->addVerse($bookId, $chapterId, $verseId, $content);
                    }
                }
            }
        }

        return $this->loadTranslationIntoDatabase(new Translation($about, $body));
    }

    private function loadTranslationIntoDatabase(Translation $translation): int
    {
        // check if we really need to update translation
        $statement = $this->db()->executeQuery(sprintf('SELECT id FROM %s WHERE id=? AND hash=?', self::TABLE_TRANSLATION), [
            $translation->getAbout()->getId(),
            $translation->getAbout()->getHash(),
        ], [
            ParameterType::STRING,
            ParameterType::STRING,
        ]);
        $translationId = $statement->fetchOne();

        if ($translationId === $translation->getAbout()->getId()) {
            $this->output->writeln(sprintf('Skipping: <info>%s</info>', $translation->getAbout()->getFile()));

            return Command::SUCCESS;
        }

        $this->output->writeln(sprintf('Importing: <info>%s</info>', $translation->getAbout()->getFile()));

        // delete existing temporary translation data table
        $this->dropTemporaryTable();

        try {
            // create translation data table
            $dataTable = new Table(self::TABLE_TEMP);
            $dataTable->addColumn('book', 'string', ['length' => '3']);
            $dataTable->addColumn('chapter', 'integer', ['length' => '3']);
            $dataTable->addColumn('verse', 'integer', ['length' => '3']);
            $dataTable->addColumn('content', 'string');
            $dataTable->addUniqueIndex(['book', 'chapter', 'verse']);

            $schemaManager = $this->db()->createSchemaManager();
            $schemaManager->createTable($dataTable);

            // fill new table with verses
            $progressBar = new ProgressBar($this->output, $translation->getTotalVerseCount());
            $progressBar->setFormat('debug');
            $progressBar->start();

            foreach ($translation->getBooks() as $bookId) {
                foreach ($translation->getChapters($bookId) as $chapterId) {
                    foreach ($translation->getVerses($bookId, $chapterId) as $verseId) {
                        $verse = $translation->getVerseAt($bookId, $chapterId, $verseId);

                        $this->db()->insert(self::TABLE_TEMP, [
                            'book' => $verse->getBookId(),
                            'chapter' => $verse->getChapterId(),
                            'verse' => $verse->getVerseId(),
                            'content' => $verse->getContent(),
                        ]);

                        $progressBar->advance();
                    }
                }
            }

            $progressBar->finish();
            $this->output->writeln('');
        } catch (\Exception $e) {
            // something went wrong, remove temporary translation table
            $this->dropTemporaryTable();

            throw $e;
        }

        $translationTable = sprintf(self::TABLE_DATA, $translation->getAbout()->getId());

        // remove old translation data table
        $this->db()->executeQuery(sprintf('DROP TABLE IF EXISTS %s', $translationTable));

        // rename temporary translation data table
        $this->db()->executeQuery(sprintf('ALTER TABLE %s RENAME %s', self::TABLE_TEMP, $translationTable));

        // remove temporary translation details if exists
        $this->removeTemporaryDetails($translation);

        try {
            // create new translation details
            $this->db()->insert(self::TABLE_TRANSLATION, [
                'shortname' => $translation->getAbout()->getShortname(),
                'language' => $translation->getAbout()->getLanguage(),
                'authorised' => (int) $translation->getAbout()->getAuthorised(),
                'name' => $translation->getAbout()->getName(),
                'description' => $translation->getAbout()->getDescription(),
                'date' => $translation->getAbout()->getDate(),
                'hash' => $translation->getAbout()->getHash(),
                'file' => $translation->getAbout()->getFile(),
                'id' => sprintf(self::ENTRY_TEMP_ID, $translation->getAbout()->getId()),
            ]);
        } catch (\Exception $e) {
            // something went wrong, remove temporary translation details
            $this->removeTemporaryDetails($translation);

            throw $e;
        }

        // remove existing translation details
        $this->db()->executeQuery(sprintf('DELETE FROM %s WHERE id=?', self::TABLE_TRANSLATION), [
            $translation->getAbout()->getId(),
        ], [
            ParameterType::STRING,
        ]);

        // rename translation details
        $this->db()->executeQuery(sprintf('UPDATE %s SET id=? WHERE id=?', self::TABLE_TRANSLATION), [
            $translation->getAbout()->getId(),
            sprintf(self::ENTRY_TEMP_ID, $translation->getAbout()->getId()),
        ], [
            ParameterType::STRING,
            ParameterType::STRING,
        ]);

        return Command::SUCCESS;
    }

    private function removeTemporaryDetails(Translation $translation): void
    {
        $this->db()->executeQuery(sprintf('DELETE FROM %s WHERE id=?', self::TABLE_TRANSLATION), [
            sprintf(self::ENTRY_TEMP_ID, $translation->getAbout()->getId()),
        ], [
            ParameterType::STRING,
        ]);
    }

    private function dropTemporaryTable(): void
    {
        $this->db()->executeQuery(sprintf('DROP TABLE IF EXISTS %s', self::TABLE_TEMP));
    }

    private function db()
    {
        if (null === $this->db) {
            $params = [
                'dbname' => $this->settings['db_name'],
                'user' => $this->settings['db_user'],
                'password' => $this->settings['db_pass'],
                'host' => $this->settings['db_host'],
                'driver' => $this->settings['db_driver'],
            ];

            $this->db = DriverManager::getConnection($params);
        }

        return $this->db;
    }

    private function displayError(string $message): int
    {
        $this->output->writeln([
            '',
            sprintf('<error>Error:</error> %s', $message),
        ]);

        return Command::FAILURE;
    }
}
