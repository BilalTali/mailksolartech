<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstallationSubmission extends Model
{
    protected $table = 'installation_submissions';
    protected $guarded = [];

    public function installationDocuments()
    {
        return $this->hasMany(InstallationDocument::class, 'installation_submission_id');
    }
}
