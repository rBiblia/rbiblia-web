<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Controller\Traits\ResponseTrait;
use rBibliaWeb\Provider\ReportProvider;
use rBibliaWeb\Renderer\ReportEmailRenderer;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class ReportController
{
    use LanguageProviderTrait;
    use ResponseTrait;

    private Mailer $mailer;

    private Email $email;

    public function __construct(array $settings)
    {
        $transport = Transport::fromDsn(\sprintf(
            'smtp://%s:%s@%s:%s',
            $settings['mailer']['smtp_user'],
            $settings['mailer']['smtp_password'],
            $settings['mailer']['smtp_host'],
            $settings['mailer']['smtp_port']
        ));

        $this->mailer = new Mailer($transport);

        $emailTo = new Address($settings['report']['email_to_address'], $settings['report']['email_to_name']);
        $emailFrom = new Address($settings['mailer']['smtp_user'], $settings['mailer']['name']);

        $this->email = (new Email())
            ->from($emailFrom)
            ->to($emailTo)
            ->subject($settings['report']['subject']);

        $headers = $this->email->getHeaders();

        $headers->addTextHeader('X-Mailer', $settings['mailer']['name']);
    }

    public function submit(string $language, ?string $inputStream = null): void
    {
        try {
            $inputStream ??= file_get_contents('php://input');
            $report = (new ReportProvider($language, $inputStream))->getReport();
        } catch (\InvalidArgumentException $e) {
            $this->setErrorResponse($e->getMessage());

            return;
        }

        $replyTo = new Address($report->getEmail(), $report->getName());
        $this->email->replyTo($replyTo);

        $emailBody = (new ReportEmailRenderer())->getTemplate($report);
        $this->email->html($emailBody);

        try {
            $this->mailer->send($this->email);
        } catch (TransportExceptionInterface $e) {
            $this->setErrorResponse($e->getMessage());
        }

        $this->setResponse();
    }
}
