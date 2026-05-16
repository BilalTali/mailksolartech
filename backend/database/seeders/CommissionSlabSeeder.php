<?php

namespace Database\Seeders;

use App\Models\CommissionSlab;
use Illuminate\Database\Seeder;

class CommissionSlabSeeder extends Seeder
{
    public function run(): void
    {
        $slabs = [
            [
                'capacity' => '1kw',
                'label' => '1 kW Solar System',
                'agent_commission' => 1000.00,
                'super_agent_override' => 300.00,
                'description' => 'Ideal for small households',
                'is_active' => false,
            ],
            [
                'capacity' => '2kw',
                'label' => '2 kW Solar System',
                'agent_commission' => 1500.00,
                'super_agent_override' => 400.00,
                'description' => 'Suitable for medium households',
                'is_active' => false,
            ],
            [
                'capacity' => '3kw',
                'label' => '3 kW Solar System',
                'agent_commission' => 2000.00,
                'super_agent_override' => 500.00,
                'description' => 'Best for large families',
                'is_active' => true,
            ],
            [
                'capacity' => '4kw',
                'label' => '4 kW Solar System',
                'agent_commission' => 2500.00,
                'super_agent_override' => 600.00,
                'description' => 'Commercial or large residential',
                'is_active' => true,
            ],
            [
                'capacity' => '5kw',
                'label' => '5 kW Solar System',
                'agent_commission' => 3000.00,
                'super_agent_override' => 700.00,
                'is_active' => true,
            ],
            [
                'capacity' => '6kw',
                'label' => '6 kW Solar System',
                'agent_commission' => 3500.00,
                'super_agent_override' => 800.00,
                'is_active' => true,
            ],
            [
                'capacity' => '7kw',
                'label' => '7 kW Solar System',
                'agent_commission' => 4000.00,
                'super_agent_override' => 900.00,
                'is_active' => true,
            ],
            [
                'capacity' => '8kw',
                'label' => '8 kW Solar System',
                'agent_commission' => 4500.00,
                'super_agent_override' => 1000.00,
                'is_active' => true,
            ],
            [
                'capacity' => '9kw',
                'label' => '9 kW Solar System',
                'agent_commission' => 5000.00,
                'super_agent_override' => 1100.00,
                'is_active' => true,
            ],
            [
                'capacity' => '10kw',
                'label' => '10 kW Solar System',
                'agent_commission' => 5500.00,
                'super_agent_override' => 1200.00,
                'is_active' => true,
            ],
        ];

        foreach ($slabs as $slab) {
            CommissionSlab::updateOrCreate(
                ['capacity' => $slab['capacity'], 'super_agent_id' => null],
                $slab
            );
        }
    }
}
