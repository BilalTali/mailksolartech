<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            SettingsSeeder::class,
            FAQSeeder::class,
            CommissionSlabSeeder::class,
            IncentiveOfferSeeder::class,
            CrmOptionSeeder::class,
        ]);
        // No agents seeded. Real agents will be created dynamically via the application UI.
    }
}
