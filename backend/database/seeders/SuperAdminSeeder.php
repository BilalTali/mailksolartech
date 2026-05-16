<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email    = env('SUPER_ADMIN_EMAIL', 'talibilal342@gmail.com');
        $name     = env('SUPER_ADMIN_NAME', 'System Super Admin');
        $mobile   = env('SUPER_ADMIN_MOBILE', '8899055335');
        $password = env('SUPER_ADMIN_PASSWORD', 'Sugen@9313');

        \App\Models\User::updateOrCreate(
            ['email' => $email],
            [
                'name'              => $name,
                'mobile'            => $mobile,
                'password'          => \Illuminate\Support\Facades\Hash::make($password),
                'role'              => \App\Models\User::ROLE_SUPER_ADMIN,
                'status'            => 'active',
                'is_wa_lead_handler'=> true,
                'is_public_contact' => true,
                'whatsapp_number'   => $mobile,
                'email_verified_at' => now(),
            ]
        );
    }
}
