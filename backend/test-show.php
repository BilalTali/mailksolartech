<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$lead = \App\Models\Lead::latest()->first();
dump(array_key_exists('surveyor_form_submitted_at', $lead->toArray()));
