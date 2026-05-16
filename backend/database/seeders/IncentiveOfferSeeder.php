<?php

namespace Database\Seeders;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Database\Seeder;

class IncentiveOfferSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::whereIn('role', ['admin', 'super_admin'])->first();
        
        if (!$admin) {
            $this->command->error('No administrative user found. Run SuperAdminSeeder first.');
            return;
        }

        $offers = [
            [
                'title' => 'Umrah Trip for Two',
                'description' => 'Complete Umrah package for two persons including flight, hotel, and visa. Achieve 50 points in a quarter to qualify.',
                'prize_label' => 'Umrah Trip for Two',
                'offer_type' => 'individual',
                'target_points' => 50,
                'prize_amount' => 150000.00,
                'offer_from' => '2026-04-01',
                'offer_to' => '2026-09-30',
                'status' => 'active',
                'visible_to' => 'both',
                'created_by' => $admin->id,
            ],
            [
                'title' => 'Hero Splendor Plus Bike',
                'description' => 'Brand new Hero Splendor Plus motorcycle. Achieve 30 points in a quarter to qualify.',
                'prize_label' => 'Hero Splendor Plus Bike',
                'offer_type' => 'individual',
                'target_points' => 30,
                'prize_amount' => 75000.00,
                'offer_from' => '2026-04-01',
                'offer_to' => '2026-09-30',
                'status' => 'active',
                'visible_to' => 'both',
                'created_by' => $admin->id,
            ],
            [
                'title' => '₹25,000 Cash Bonus',
                'description' => 'Direct bank transfer of ₹25,000. Achieve 20 points in a quarter to qualify.',
                'prize_label' => '₹25,000 Cash Bonus',
                'offer_type' => 'individual',
                'target_points' => 20,
                'prize_amount' => 25000.00,
                'offer_from' => '2026-04-01',
                'offer_to' => '2026-06-30',
                'status' => 'active',
                'visible_to' => 'both',
                'created_by' => $admin->id,
            ],
        ];

        foreach ($offers as $offer) {
            Offer::updateOrCreate(
                ['title' => $offer['title']],
                $offer
            );
        }
    }
}
