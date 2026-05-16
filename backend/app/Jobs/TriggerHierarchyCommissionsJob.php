<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Models\User;
use App\Services\CommissionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class TriggerHierarchyCommissionsJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public $lead;
    public $changer;

    /**
     * Create a new job instance.
     */
    public function __construct(Lead $lead, User $changer)
    {
        $this->lead = $lead;
        $this->changer = $changer;
    }

    /**
     * Execute the job.
     */
    public function handle(CommissionService $commissionService): void
    {
        $commissionService->triggerHierarchyCommissions($this->lead, $this->changer);
    }
}
