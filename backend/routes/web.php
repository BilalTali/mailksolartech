<?php

use App\Http\Controllers\Admin\ICardController;
use App\Http\Controllers\Admin\JoiningLetterController;
use App\Http\Controllers\Solar\DocumentController;
use App\Http\Controllers\Solar\LeadDocumentController;

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;


// Public QR Verification Page
Route::get('/verify/{token}', [\App\Http\Controllers\Solar\QrVerificationController::class, 'verify'])
    ->name('qr.verify');

Route::get('/sitemap.xml', [\App\Http\Controllers\Solar\SitemapController::class, 'index']);
Route::get('/robots.txt', [\App\Http\Controllers\Solar\SitemapController::class, 'robots']);

Route::get('/', function () {
    return response()->json(['message' => 'API is running']);
});

Route::get('/favicon.ico', function () {
    $faviconPath = \App\Models\Setting::getValue('company_favicon', 'branding/favicon.ico');
    if ($faviconPath && \Illuminate\Support\Facades\Storage::disk('public')->exists($faviconPath)) {
        return response()->file(storage_path('app/public/'.$faviconPath));
    }
    abort(404);
});

// Serve all storage files directly via PHP (bypasses Hostinger symlink restrictions)
Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    if (file_exists($fullPath) && is_file($fullPath)) {
        return response()->file($fullPath);
    }
    return response('Not found: ' . $path, 404);
})->where('path', '.*');


Route::get('/icons/icon-{size}.png', function ($size) {
    $faviconPath = \App\Models\Setting::getValue('company_favicon');
    if ($faviconPath && \Illuminate\Support\Facades\Storage::disk('public')->exists($faviconPath)) {
        return response()->file(storage_path('app/public/'.$faviconPath));
    }
    // Fallback to a default if not found
    $fallback = public_path('vite.svg');

    return response()->file($fallback);
})->where('size', '192|512');



// ── Admin Preview Routes (Keep in web for easier preview) ────────────
Route::middleware(['web', 'auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/joining-letter/{user}/preview', [JoiningLetterController::class, 'preview'])
        ->name('joining-letter.preview');
});

// ── Shared Signed Document View Routes (In web.php to prevent JSON errors) ──
Route::get('/leads/{ulid}/annexure-b', [LeadDocumentController::class, 'showAnnexureB'])
    ->name('leads.annexure_b')
    ->middleware('signed');

Route::get('/leads/{ulid}/agreement', [LeadDocumentController::class, 'showAgreement'])
    ->name('leads.agreement')
    ->middleware('signed');

Route::get('/document-view/{id}/{type}', [DocumentController::class, 'viewSigned'])
    ->name('documents.signed-view');

Route::get('/icard-download2/{userId?}', [ICardController::class, 'download2'])
    ->name('icard.download2')
    ->middleware('signed');

Route::get('/joining-letter-download/{userId}', [JoiningLetterController::class, 'download'])
    ->name('joining-letter.download')
    ->middleware('signed');
