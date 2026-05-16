<?php

namespace App\Console\Commands;

use App\Models\Offer;
use App\Services\OfferService;
use Illuminate\Console\Command;

class ProcessExpiredOffers extends Command
{
    /**
     * The name and signature of the console command.
     *
                    @var string
     */
    protected $signature = 'offers:process-expired';

    /**
     * The console command description.
     *
                    @var string
     */
    protected $description = 'Find offers where (offer_to + grace_period) has passed and process point absorption';

    /**
     * Execute the console command.
     */
    public function handle(OfferService $offerService)
    {
        $this->info('Checking for expired offers requiring absorption...');

        // Find offers that ended (offer_to passed) AND grace period also passed
        // AND have not been processed yet.
        $expiredOffers = Offer::query()->where(fn ($q) => $q->whereNull('absorption_processed_at'))
            ->where(fn ($q) => $q->where('status', 'active'))
            ->where(fn ($q) => $q->whereNotNull('offer_to'))
            ->get()
            ->filter(function ($offer) {
                // grace_period_ends_at is basically (offer_to + grace_period_days)
                return now()->gt($offer->grace_period_ends_at);
            });

        /** @var \Illuminate\Support\Collection<int, Offer> $expiredOffers */

        if ($expiredOffers->isEmpty()) {
            $this->info('No newly expired offers found.');

            return;
        }

        foreach ($expiredOffers as $offer) {
            /** @var Offer $offer */
            $this->info("Processing Offer ID: {$offer->id} ({$offer->title})...");

            $stats = $offerService->processOfferExpiry($offer);

            $this->table(
                ['Agents Processed', 'Absorbed', 'Grace Expired', 'Points Transfer'],
                [[$stats['agents_processed'], $stats['agents_absorbed'], $stats['agents_grace_period_expired'], $stats['total_points_absorbed']]]
            );
        }

        $this->info('Expiry processing complete.');
    }
}
