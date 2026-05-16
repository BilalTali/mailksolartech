<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CrmOption;

class CrmOptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $options = [
            // System Capacities
            ['category' => 'system_capacity', 'value' => '3kw', 'label' => '3 kW', 'sort_order' => 1],
            ['category' => 'system_capacity', 'value' => '3.3kw', 'label' => '3.3 kW', 'sort_order' => 2],
            ['category' => 'system_capacity', 'value' => '4kw', 'label' => '4 kW', 'sort_order' => 3],
            ['category' => 'system_capacity', 'value' => '5kw', 'label' => '5 kW', 'sort_order' => 4],
            ['category' => 'system_capacity', 'value' => '5.5kw', 'label' => '5.5 kW', 'sort_order' => 5],
            ['category' => 'system_capacity', 'value' => '6kw', 'label' => '6 kW', 'sort_order' => 6],
            ['category' => 'system_capacity', 'value' => '7kw', 'label' => '7 kW', 'sort_order' => 7],
            ['category' => 'system_capacity', 'value' => '8kw', 'label' => '8 kW', 'sort_order' => 8],
            ['category' => 'system_capacity', 'value' => '9kw', 'label' => '9 kW', 'sort_order' => 9],
            ['category' => 'system_capacity', 'value' => '10kw', 'label' => '10 kW', 'sort_order' => 10],
            ['category' => 'system_capacity', 'value' => 'above_10kw', 'label' => 'Above 10 kW', 'sort_order' => 11],
            ['category' => 'system_capacity', 'value' => 'above_3kw', 'label' => 'Above 3 kW (Legacy)', 'sort_order' => 12],
            ['category' => 'system_capacity', 'value' => '1kw', 'label' => '1 kW (Legacy)', 'sort_order' => 13],
            ['category' => 'system_capacity', 'value' => '2kw', 'label' => '2 kW (Legacy)', 'sort_order' => 14],

            // Discom Names
            ['category' => 'discom_name', 'value' => 'JPDCL', 'label' => 'JPDCL', 'sort_order' => 1],
            ['category' => 'discom_name', 'value' => 'KPDCL', 'label' => 'KPDCL', 'sort_order' => 2],

            // Roof Sizes
            ['category' => 'roof_size', 'value' => 'less_100', 'label' => 'Less than 100 sq ft', 'sort_order' => 1],
            ['category' => 'roof_size', 'value' => '100_200', 'label' => '100 – 200 sq ft', 'sort_order' => 2],
            ['category' => 'roof_size', 'value' => '200_300', 'label' => '200 – 300 sq ft', 'sort_order' => 3],
            ['category' => 'roof_size', 'value' => '300_plus', 'label' => '300+ sq ft', 'sort_order' => 4],
        ];

        foreach ($options as $opt) {
            CrmOption::updateOrCreate(
                ['category' => $opt['category'], 'value' => $opt['value']],
                ['label' => $opt['label'], 'sort_order' => $opt['sort_order'], 'is_active' => true]
            );
        }
    }
}
