<?php

namespace Database\Seeders;

use App\Models\FAQ;
use Illuminate\Database\Seeder;

class FAQSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'How much subsidy can I get under PM Surya Ghar Muft Bijli Yojana?',
                'answer' => 'The government subsidy is capped at ₹94,800 for residential rooftop solar systems of 3 kW or higher capacity.',
                'category' => 'Subsidy',
                'sort_order' => 1,
            ],
            [
                'question' => 'Who is eligible for this solar scheme?',
                'answer' => 'Any Indian household with a suitable roof for solar installation and an active electricity connection is eligible. Applicant must not have availed any other solar subsidy previously.',
                'category' => 'Eligibility',
                'sort_order' => 2,
            ],
            [
                'question' => 'What documents are required for registration?',
                'answer' => 'You need a recent electricity bill, proof of identity (Aadhaar Card), and proof of ownership of the house or the roof.',
                'category' => 'Registration',
                'sort_order' => 3,
            ],
            [
                'question' => 'How long does the installation process take?',
                'answer' => 'Typically, the process from registration to installation takes 30 to 45 days, depending on the approval from the local DISCOM.',
                'category' => 'Installation',
                'sort_order' => 4,
            ],
            [
                'question' => 'Is there any maintenance cost for the solar panels?',
                'answer' => 'Solar panels require minimal maintenance, mainly regular cleaning to remove dust. Most systems come with a 25-year performance warranty.',
                'category' => 'Maintenance',
                'sort_order' => 5,
            ],
            [
                'question' => 'How can I track my application status?',
                'answer' => 'You can track your application status on our website by entering your registered mobile number in the "Track Status" section.',
                'category' => 'Support',
                'sort_order' => 6,
            ],
        ];

        foreach ($faqs as $faq) {
            FAQ::updateOrCreate(['question' => $faq['question']], $faq);
        }
    }
}
