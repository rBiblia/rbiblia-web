<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use Doctrine\DBAL\Exception;
use Doctrine\DBAL\ParameterType;
use rBibliaWeb\Controller\Traits\DatabaseTrait;
use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Controller\Traits\ResponseTrait;
use rBibliaWeb\Provider\LanguageProvider;

class TranslationController
{
    use DatabaseTrait;
    use LanguageProviderTrait;
    use ResponseTrait;

    final public const TABLE_TRANSLATION = 'translation';
    final public const TABLE_DATA = 'data_%s';
    private const TABLE_SECURITY = 'security';

    private int $securityQueryLimit = 0;

    public function __construct(array $settings)
    {
        $this->securityQueryLimit = $settings['security_query_limit'];
        $this->createDatabaseConnection($settings);
    }

    public function getTranslationList(string $language): void
    {
        try {
            $statement = $this->db->executeQuery(sprintf(
                'SELECT id, language, name, description, date FROM %s ORDER BY language ASC',
                self::TABLE_TRANSLATION
            ));

            $response = [];
            while (($row = $statement->fetchAssociative()) !== false) {
                $response[] = [
                    'id' => $row['id'],
                    'language' => $row['language'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'date' => $row['date'],
                ];
            }

            $this->setResponse($response);
        } catch (Exception) {
            $this->renderDatabaseConnectionErrorResponse($language);
        }
    }

    public function getTranslationStructureById(string $language, string $translationId): void
    {
        $this->checkIfTranslationTableExists($language, $translationId);

        try {
            $statement = $this->db->executeQuery(sprintf(
                'SELECT DISTINCT book, chapter FROM %s ORDER BY book ASC, chapter ASC',
                self::getTranslationTable($translationId)
            ));

            $results = [];
            while (($row = $statement->fetchAssociative()) !== false) {
                $results[$row['book']][] = (int)$row['chapter'];
            }

            $response = [];
            foreach (array_keys($this->getLanguageProvider($language)->getAliases()) as $alias) {
                if (isset($results[$alias])) {
                    $response[$alias] = $results[$alias];
                }
            }

            $this->setResponse($response);
        } catch (Exception) {
            $this->renderDatabaseConnectionErrorResponse($language);
        }
    }

    public function getVerses(string $language, string $translationId, string $bookId, int $chapterId): void
    {
        $this->checkIfTranslationTableExists($language, $translationId);
        $this->trackAndValidateQueryUsage($language);

        try {
            $statement = $this->db->executeQuery(sprintf(
                'SELECT verse, content FROM %s WHERE book=? AND chapter=? ORDER BY verse ASC',
                self::getTranslationTable($translationId)
            ), [
                $bookId,
                $chapterId,
            ], [
                ParameterType::STRING,
                ParameterType::INTEGER,
            ]);

            $response = [];
            while (($row = $statement->fetchAssociative()) !== false) {
                $response[$row['verse']] = $row['content'];
            }

            if ($response === []) {
                $this->setErrorResponse($this->getLanguageProvider($language)->showMessage('error_no_verses_found'));
            }

            $this->setResponse($response);
        } catch (Exception) {
            $this->renderDatabaseConnectionErrorResponse($language);
        }
    }

    public static function getTranslationTable(string $translationId): string
    {
        return sprintf(self::TABLE_DATA, $translationId);
    }

    private function checkIfTranslationTableExists(string $language, string $translationId): void
    {
        try {
            $result = $this->db->fetchOne('SHOW TABLES LIKE ?', [
                self::getTranslationTable($translationId),
            ], [
                ParameterType::STRING,
            ]);

            if (empty($result)) {
                $this->setErrorResponse($this->getLanguageProvider($language)
                    ->showMessage(LanguageProvider::MSG_ERROR_TRANSLATION_NOT_FOUND));
            }
        } catch (Exception) {
            $this->renderDatabaseConnectionErrorResponse($language);
        }
    }

    private function trackAndValidateQueryUsage(string $language): void
    {
        $ip = $this->getIP();

        // IP address is incorrect
        if ($ip === '' || '0.0.0.0' === $ip) {
            $this->setErrorResponse($this->getLanguageProvider($language)
                ->showMessage(LanguageProvider::MSG_ERROR_WRONG_IP_ADDRESS));
        }

        try {
            // remove all IP addresses older than today
            $this->db->executeQuery(sprintf(
                'DELETE FROM %s WHERE DATE<CURDATE()',
                self::TABLE_SECURITY
            ));

            // query for a given IP address
            $response = $this->db->fetchOne(sprintf(
                'SELECT query_counter FROM %s WHERE ip=? AND DATE(date)=CURDATE()',
                self::TABLE_SECURITY
            ), [
                ip2long($ip),
            ], [
                ParameterType::INTEGER,
            ]);

            // insert IP address for tracking
            if (false === $response) {
                $this->db->insert(self::TABLE_SECURITY, [
                    'ip' => ip2long($ip),
                ]);

                return;
            }

            // limit exceeded, thrown an exception
            if ($this->securityQueryLimit > 0 && (int)$response >= $this->securityQueryLimit) {
                $this->setErrorResponse($this->getLanguageProvider($language)
                    ->showMessage(LanguageProvider::MSG_ERROR_QUERY_LIMIT_EXCEEDED));
            }

            // increment query counter for current IP address
            $this->db->executeQuery(sprintf(
                'UPDATE %s SET query_counter=query_counter+1 WHERE ip=? AND DATE(date)=CURDATE()',
                self::TABLE_SECURITY
            ), [
                ip2long($ip),
            ], [
                ParameterType::INTEGER,
            ]);
        } catch (Exception) {
            $this->renderDatabaseConnectionErrorResponse($language);
        }
    }

    private function getIP(): string
    {
        $httpXForwardedFor = getenv('HTTP_X_FORWARDED_FOR');

        if ($httpXForwardedFor === '' || $httpXForwardedFor === false) {
            return (string)getenv('REMOTE_ADDR');
        }

        return $httpXForwardedFor;
    }
}
