<?php declare(strict_types=1);

namespace rBibliaWeb\Renderer;

use rBibliaWeb\Value\Report;

class ReportEmailRenderer
{
    public function getTemplate(Report $report): string
    {
        ob_start();

        require_once __DIR__.'/../../view/email/email_report.phtml';

        return (string)ob_get_clean();
    }
}
