<?php

use App\Http\Controllers\Solar\AchievementController;
// Auth
use App\Http\Controllers\Solar\DocumentController;
// Public
use App\Http\Controllers\Solar\FeedbackController;
use App\Http\Controllers\Admin\MediaController;
// Agent
use App\Http\Controllers\Solar\PublicController;
use App\Http\Controllers\Dashboard\BankingStatsController;
use App\Http\Controllers\Admin\FAQController as AdminFAQController;
use App\Http\Controllers\Admin\AdminAgentController as AdminAgentController;
use App\Http\Controllers\Api\V1\Admin\CommissionSlabController as AdminCommissionSlabController;
use App\Http\Controllers\Admin\AdminDashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\AdminLedgerController;
// Super Agent
use App\Http\Controllers\Admin\AdminLeadController as AdminLeadController;
use App\Http\Controllers\Admin\AdminOfferController as AdminOfferController;
use App\Http\Controllers\Admin\WithdrawalController as AdminWithdrawalController;
use App\Http\Controllers\Admin\OperatorController as AdminOperatorController;
use App\Http\Controllers\Admin\AdminTechnicalTeamController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\AdminSuperAgentController as AdminSuperAgentController;
// Super Admin
use App\Http\Controllers\Admin\AdminManagementController;
use App\Http\Controllers\Admin\MonitoringController;
use App\Http\Controllers\Admin\AdminNotificationController;
// Admin
use App\Http\Controllers\Admin\AgentDashboardController as AgentDashboardController;
use App\Http\Controllers\Admin\AgentLeadController as AgentLeadController;
use App\Http\Controllers\Admin\AgentNotificationController as AgentNotificationController;
use App\Http\Controllers\Admin\AgentOfferController as AgentOfferController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SharedProfileController;
use App\Http\Controllers\Admin\ICardController;
use App\Http\Controllers\Admin\JoiningLetterController;
use App\Http\Controllers\Solar\LeadDocumentController;
use App\Http\Controllers\Solar\EligibilityController;
use App\Http\Controllers\Solar\PortalLeadController as PublicLeadController;
use App\Http\Controllers\Technical\TechnicalDashboardController;
// CMS
use App\Http\Controllers\Admin\SuperAgentAgentController as SAAgentController;
use App\Http\Controllers\Admin\SuperAgentDashboardController as SADashboardController;
use App\Http\Controllers\Admin\SuperAgentLeadController as SALeadController;
use App\Http\Controllers\Admin\SuperAgentNotificationController as SANotificationController;
use App\Http\Controllers\Admin\SuperAgentOfferController as SAOfferController;

use App\Http\Controllers\SuperAdmin\FAQController as SAFAQController;
use Illuminate\Support\Facades\Route;

// Health check — no auth required — used by uptime monitoring
Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::select('SELECT 1');

        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'timestamp' => now()->toISOString(),
            'version' => config('app.version', '1.0.0'),
            'env' => app()->environment(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'database' => 'disconnected',
            'message' => 'Service unavailable',
        ], 503);
    }
});

/** @var \Illuminate\Routing\RouteRegistrar $api */
$api = Route::prefix('v1');
$api->as('api.v1.')->group(function () {

    // ==============================
    // PUBLIC ROUTES
    // ==============================
    Route::post('/public/leads', [PublicLeadController::class, 'store'])->middleware('throttle:forms');
    Route::get('/public/leads/track', [PublicLeadController::class, 'track']);
    Route::post('/public/agent-register', [PublicLeadController::class, 'registerAgent'])->middleware('throttle:forms');
    Route::post('/public/enumerator-register', [PublicLeadController::class, 'registerEnumerator'])->middleware('throttle:forms');
    Route::get('/public/eligibility', [EligibilityController::class, 'index'])->middleware(\App\Http\Middleware\CacheResponse::class);
    // Route::get('/public/commission-slabs', [AdminCommissionSlabController::class, 'index']);
    Route::get('/public/incentive-offers', [AdminOfferController::class, 'index'])->middleware(\App\Http\Middleware\CacheResponse::class);

    // CMS Public (no auth required)
    Route::get('/public/settings', [PublicController::class, 'settings'])->middleware(\App\Http\Middleware\CacheResponse::class);
    Route::get('/public/achievements', [PublicController::class, 'achievements'])->middleware(\App\Http\Middleware\CacheResponse::class);
    Route::get('/public/feedbacks', [PublicController::class, 'feedbacks'])->middleware(\App\Http\Middleware\CacheResponse::class);
    Route::get('/public/media', [MediaController::class, 'index'])->middleware(\App\Http\Middleware\CacheResponse::class); // Public Reward Winners
    Route::post('/public/feedback', [FeedbackController::class, 'store'])->middleware('throttle:forms');
    Route::get('/public/verify-agent/{token}', [PublicController::class, 'verifyAgent']);
    Route::get('/public/help', [PublicController::class, 'help']);

    Route::get('/public/crm-options', [\App\Http\Controllers\CrmOptionController::class, 'getPublicOptions'])->middleware(\App\Http\Middleware\CacheResponse::class);

    // Signed Lead Document View (Publicly accessible via signature)
    Route::get('/public/leads/{ulid}/documents/{id}/view', [LeadDocumentController::class, 'viewSigned'])
         ->name('leads.documents.signed-view');
    Route::get('/public/leads/{ulid}/installation-documents/{id}/view', [LeadDocumentController::class, 'viewSignedInstallation'])
        ->name('leads.installation-documents.signed-view');

    // Note: Signed View routes moved to web.php to avoid JSON error responses in browser tabs

    // =========================================================================
    // 1. AUTHENTICATION (PUBLIC)
    // =========================================================================
    // These must remain public and NOT be wrapped in auth:sanctum.
    // They use low-threshold throttling to prevent brute-force attacks.
    Route::prefix('auth')->group(function () {
        Route::post('/send-otp', [AuthController::class, 'sendOtp'])->middleware('throttle:15,1');
        Route::post('/login-otp', [AuthController::class, 'loginOtp'])->middleware('throttle:15,1');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    });

    // Consumer Portal Public Login
    Route::post('/consumer/login', [\App\Http\Controllers\Consumer\ConsumerController::class, 'login'])
        ->middleware('throttle:10,1');

    // ==============================
    // 2. OTHER PUBLIC ROUTES
    // ==============================

    // Note: ICard and Joining Letter downloads moved to web.php for consistent browser handling

    Route::middleware(['auth:sanctum', 'throttle:auth'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/set-password', [AuthController::class, 'setPassword']);
        Route::post('/auth/profile-photo', [AuthController::class, 'uploadProfilePhoto']);
        Route::put('/profile/change-password', [SharedProfileController::class, 'changePassword']);

        // Banking Dashboard Modules
        Route::get('/dashboard/banking-stats', [BankingStatsController::class, 'getSummary']);
        Route::get('/dashboard/banking-leads', [BankingStatsController::class, 'getLeads']);
        Route::get('/dashboard/banking-bank-table', [BankingStatsController::class, 'getBankAggregatedTable']);
        Route::get('/dashboard/banking-lead-table', [BankingStatsController::class, 'getBankLeadTable']);
        Route::get('/dashboard/banking-filter-options', [BankingStatsController::class, 'getBankFilterOptions']);

        // Web Push Subscriptions
        Route::post('/push/subscribe', [\App\Http\Controllers\Shared\PushSubscriptionController::class, 'subscribe']);
        Route::delete('/push/unsubscribe', [\App\Http\Controllers\Shared\PushSubscriptionController::class, 'unsubscribe']);
        Route::get('/icard/download-url2', [ICardController::class, 'getDownloadUrl2']);
        Route::get('/joining-letter/download-url', [JoiningLetterController::class, 'getDownloadUrl']);
        Route::get('/documents', [DocumentController::class, 'index']); // Auth-only resources
        Route::get('/documents/{id}/view-url', [DocumentController::class, 'getSignedUrl']);




        // Lead Documents
        Route::get('/leads/{ulid}/documents/{id}/download', [LeadDocumentController::class, 'download'])->name('leads.documents.download');
        Route::get('/leads/{ulid}/documents/{id}/view-url', [LeadDocumentController::class, 'getSignedUrl']);
        
        Route::get('/leads/{ulid}/documents/all', [LeadDocumentController::class, 'index']);
        Route::get('/leads/{ulid}/pdf/quotation', [\App\Http\Controllers\Admin\LeadBillController::class, 'downloadQuotation']);
        Route::get('/leads/{ulid}/pdf/receipt', [\App\Http\Controllers\Admin\LeadBillController::class, 'downloadReceipt']);

        // Shared Lead Status Updates
        Route::put('/leads/{ulid}/status', [AdminLeadController::class, 'updateStatus']);
        Route::get('/leads/{ulid}/available-statuses', [AdminLeadController::class, 'availableStatuses']);

        // Authenticated settings lookup works for all sub-roles to fetch their parent admin's branding
        Route::get('/admin/settings', [AdminSettingController::class, 'index']);

        // Settings write — admin middleware applied here, NOT via prefix('admin') to avoid double-prefix /admin/admin/settings
        Route::middleware('admin')->group(function () {
            Route::put('/admin/settings', [AdminSettingController::class, 'updateBulk']);
            Route::post('/admin/settings/upload', [AdminSettingController::class, 'uploadFile']);
            Route::put('/admin/profile', [AdminSettingController::class, 'updateProfile']);

            // Admin self-participation in offers
            Route::get('/admin/my-offers', [AdminOfferController::class, 'myOffers']);
            Route::get('/admin/my-redemptions', [AdminOfferController::class, 'myRedemptions']);
            Route::post('/admin/offers/{id}/redeem', [AdminOfferController::class, 'redeem']);
            Route::get('/admin/points/master-overview', [AdminOfferController::class, 'masterOverview']);
        });

        // ==========================================
        // TECHNICAL TEAM PORTAL
        // ==========================================
        Route::middleware([\App\Http\Middleware\TechnicalTeamMiddleware::class, 'throttle:120,1'])->prefix('technical')->group(function () {
            Route::get('/stats', [TechnicalDashboardController::class, 'getStats']);
            Route::get('/commissions', [TechnicalDashboardController::class, 'getCommissions']);
            Route::get('/profile', [AuthController::class, 'me']);
            Route::put('/profile', [SharedProfileController::class, 'update']);
            Route::get('/leads', [TechnicalDashboardController::class, 'getAssignedLeads']);
            Route::post('/leads/{ulid}/visit', [TechnicalDashboardController::class, 'submitVisit'])->middleware('throttle:30,1');
            Route::post('/leads/{ulid}/survey', [TechnicalDashboardController::class, 'submitSurveyForm'])->middleware('throttle:30,1');
            Route::post('/leads/{ulid}/receipt', [TechnicalDashboardController::class, 'confirmMaterialReceipt']);
            Route::post('/leads/{ulid}/complete-support', [TechnicalDashboardController::class, 'completeSupportTask']);
            Route::get('/leads/{ulid}/checklist', [\App\Http\Controllers\Technical\InstallationController::class, 'getChecklist']);
            Route::post('/leads/{ulid}/installation', [\App\Http\Controllers\Technical\InstallationController::class, 'submitChecklist'])->middleware('throttle:30,1');
        });

        // ==============================
        // ENUMERATOR ROUTES
        // ==============================
        Route::middleware(['enumerator', 'throttle:120,1'])->prefix('enumerator')->group(function () {
            Route::get('/dashboard/stats', [\App\Http\Controllers\Admin\EnumeratorDashboardController::class, 'stats']);
            Route::get('/profile', [AuthController::class, 'me']);
            Route::put('/profile', [SharedProfileController::class, 'update']);
            
            Route::get('/leads', [\App\Http\Controllers\Admin\EnumeratorLeadController::class, 'index']);
            Route::post('/leads', [\App\Http\Controllers\Admin\EnumeratorLeadController::class, 'store']);
            Route::get('/leads/{ulid}', [\App\Http\Controllers\Admin\EnumeratorLeadController::class, 'show']);
            Route::post('/leads/{ulid}/documents', [\App\Http\Controllers\Admin\EnumeratorLeadController::class, 'uploadDocument'])->middleware('throttle:30,1');
            
            Route::get('/commissions', [\App\Http\Controllers\Admin\EnumeratorCommissionController::class, 'index']);
            
            Route::get('/notifications', [\App\Http\Controllers\Admin\EnumeratorNotificationController::class, 'index']);
            Route::put('/notifications/{id}/read', [\App\Http\Controllers\Admin\EnumeratorNotificationController::class, 'markAsRead']);
            
            Route::get('/withdrawals', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'index']);
            Route::post('/withdrawals', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'store']);
            Route::get('/offers', [\App\Http\Controllers\Admin\EnumeratorOfferController::class, 'index']);
            Route::post('/offers/{id}/redeem', [\App\Http\Controllers\Admin\EnumeratorOfferController::class, 'redeem']);
            Route::get('/offers/redemptions', [\App\Http\Controllers\Admin\EnumeratorOfferController::class, 'redemptions']);
        });

        // ==============================
        // AGENT ROUTES
        // ==============================
        Route::middleware(['agent', 'throttle:120,1'])->prefix('agent')->group(function () {
            Route::get('/dashboard/stats', [AgentDashboardController::class, 'stats']);

            Route::get('/profile', [AuthController::class, 'me']);
            Route::get('/profile/qr-scans', [AgentDashboardController::class, 'getQrScans']);

            Route::get('/leads', [AgentLeadController::class, 'index']);
            Route::get('/leads/{ulid}', [AgentLeadController::class, 'show']);
            Route::post('/leads', [AgentLeadController::class, 'store']);
            Route::put('/leads/{ulid}/resubmit', [AgentLeadController::class, 'resubmit']);
            Route::put('/leads/{ulid}/verify', [AgentLeadController::class, 'verify']);
            Route::put('/leads/{ulid}/revert', [AgentLeadController::class, 'revert']);
            Route::get('/leads/{ulid}/verification-history', [AgentLeadController::class, 'verificationHistory']);
            Route::post('/leads/{ulid}/documents', [AgentLeadController::class, 'uploadDocument'])->middleware('throttle:30,1');

            Route::get('/commissions', [\App\Http\Controllers\Admin\AgentCommissionController::class, 'index']);
            Route::get('/commissions/summary', [\App\Http\Controllers\Admin\AgentCommissionController::class, 'summary']);
            Route::post('/leads/{ulid}/commission/enumerator', [\App\Http\Controllers\Admin\AgentCommissionController::class, 'enterEnumeratorCommission']);
            Route::put('/commissions/{id}', [\App\Http\Controllers\Admin\AgentCommissionController::class, 'update']);
            Route::put('/commissions/{id}/mark-paid', [\App\Http\Controllers\Admin\AgentCommissionController::class, 'markPaid']);

            Route::get('/notifications', [AgentNotificationController::class, 'index']);
            Route::put('/notifications/{id}/read', [AgentNotificationController::class, 'markAsRead']);

            // My assigned Super Agent
            Route::get('/my-super-agent', function (\Illuminate\Http\Request $r) {
                $user = $r->user()->load('superAgent');

                return response()->json(['success' => true, 'data' => $user->superAgent]);
            });

            Route::get('/offers', [AgentOfferController::class, 'index']);
            Route::post('/offers/{id}/redeem', [AgentOfferController::class, 'redeem']);
            Route::get('/offers/redemptions', [AgentOfferController::class, 'redemptions']);
            Route::get('/offers/absorbed-points', [AgentOfferController::class, 'absorbedPoints']);
            Route::post('/offers/absorbed-points/{id}/claim', [AgentOfferController::class, 'claimAbsorbedPoints']);

            Route::put('/profile', [SharedProfileController::class, 'update']);

            // Enumerators
            Route::apiResource('enumerators', \App\Http\Controllers\Admin\AgentEnumeratorController::class)->names('agent.enumerators');
            Route::put('/enumerators/{id}/status', [\App\Http\Controllers\Admin\AgentEnumeratorController::class, 'updateStatus']);

            Route::get('/withdrawals', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'index']);
            Route::post('/withdrawals', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'store']);
        });

        // ==============================
        // SUPER AGENT ROUTES
        // ==============================
        Route::middleware(['super_agent', 'throttle:120,1'])->prefix('super-agent')->group(function () {
            Route::get('/dashboard/stats', [SADashboardController::class, 'stats']);

            Route::get('/agents', [SAAgentController::class, 'index']);
            Route::post('/agents', [SAAgentController::class, 'store']);
            Route::get('/agents/{agent_id}', [SAAgentController::class, 'show']);

            Route::get('/leads', [SALeadController::class, 'index']);
            Route::post('/leads', [SALeadController::class, 'store']);
            Route::get('/leads/{ulid}', [SALeadController::class, 'show']);
            Route::put('/leads/{ulid}/verify', [SALeadController::class, 'verify']);
            Route::put('/leads/{ulid}/revert', [SALeadController::class, 'revert']);
            Route::put('/leads/{ulid}/notes', [SALeadController::class, 'updateNotes']);
            Route::put('/leads/{ulid}/assign', [SALeadController::class, 'assign']);
            Route::put('/leads/{ulid}/assign-agent', [SALeadController::class, 'assignToAgent']);
            Route::get('/leads/{ulid}/verification-history', [SALeadController::class, 'verificationHistory']);
            Route::post('/leads/{ulid}/documents', [SALeadController::class, 'uploadDocument'])->middleware('throttle:30,1');

            Route::get('/commissions', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'index']);
            Route::get('/commissions/summary', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'summary']);
            Route::get('/commissions/profit-ledger', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'profitLedger']);
            Route::get('/commissions/profit-ledger/export', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'exportProfitLedger']);
            Route::post('/leads/{ulid}/commission/agent', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'enterAgentCommission']);
            Route::post('/leads/{ulid}/commission/enumerator', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'enterEnumeratorCommission']);
            Route::put('/commissions/{id}', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'update']);
            Route::put('/commissions/{id}/mark-paid', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'markPaid']);
            Route::get('/leads/{ulid}/commissions', [\App\Http\Controllers\Admin\SuperAgentCommissionController::class, 'getLeadCommissions']);

            Route::get('/notifications', [SANotificationController::class, 'index']);
            Route::put('/notifications/{id}/read', [SANotificationController::class, 'markRead']);
            Route::put('/notifications/mark-all-read', [SANotificationController::class, 'markAllRead']);

            Route::get('/offers', [SAOfferController::class, 'index']);
            Route::get('/offers/team-performance', [SAOfferController::class, 'teamPerformance']);
            Route::get('/offers/absorbed-points', [SAOfferController::class, 'absorbedPoints']);
            Route::post('/offers/absorbed-points/{absorbedPoint}/claim', [SAOfferController::class, 'claimAbsorbed']);
            Route::post('/offers/{id}/redeem', [SAOfferController::class, 'redeem']);
            Route::get('/offers/redemptions', [SAOfferController::class, 'redemptions']);

            Route::get('/profile', [AuthController::class, 'me']);
            Route::get('/profile/qr-scans', [SADashboardController::class, 'getQrScans']);
            Route::put('/profile', [SharedProfileController::class, 'update']);
            Route::put('/change-password', [SharedProfileController::class, 'changePassword']);

            // Route::get('/commission-slabs', [\App\Http\Controllers\Api\V1\SuperAgent\CommissionSlabController::class, 'index']);
            // Route::post('/commission-slabs', [\App\Http\Controllers\Api\V1\SuperAgent\CommissionSlabController::class, 'store']);

            // Enumerators
            Route::apiResource('enumerators', \App\Http\Controllers\Admin\SuperAgentEnumeratorController::class)->names('super-agent.enumerators');
            Route::put('/enumerators/{id}/status', [\App\Http\Controllers\Admin\SuperAgentEnumeratorController::class, 'updateStatus']);
        });

        // ADMIN ROUTES
        // ==============================
        Route::middleware(['admin', 'throttle:300,1'])->prefix('admin')->group(function () {
            // Security Area (Requires OTP)
            Route::post('/security/send-otp', [\App\Http\Controllers\Auth\SecurityOtpController::class, 'sendOtp']);
            Route::post('/security/verify-otp', [\App\Http\Controllers\Auth\SecurityOtpController::class, 'verifyOtp']);
            Route::get('/security/check-status', [\App\Http\Controllers\Auth\SecurityOtpController::class, 'checkStatus']);

            Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats'])->name('dashboard.stats');
            Route::post('/dashboard/fix-hierarchy', [AdminDashboardController::class, 'fixHierarchy'])->name('dashboard.fix-hierarchy');

            // Admin Ledger & Allowances
            Route::get('/ledger', [AdminLedgerController::class, 'index']);
            Route::post('/ledger/expense', [AdminLedgerController::class, 'storeExpense']);
            Route::post('/ledger/allowance', [AdminLedgerController::class, 'storeAllowance']);

            // Agents
            Route::get('/agents', [AdminSuperAgentController::class, 'unassignedAgents']);
            Route::put('/agents/{id}/status', [AdminAgentController::class, 'updateStatus']);
            Route::apiResource('agents', AdminAgentController::class);
            Route::post('/agents/{id}/regenerate-qr', [AdminAgentController::class, 'regenerateQr']);
            Route::get('/agents/{id}/qr-scans', [AdminAgentController::class, 'getQrScans']);

            // Enumerators
            Route::apiResource('enumerators', \App\Http\Controllers\Admin\AdminEnumeratorController::class)->names('admin.enumerators');
            Route::put('/enumerators/{id}/status', [\App\Http\Controllers\Admin\AdminEnumeratorController::class, 'updateStatus']);

            // Operators (Admin-only management)
            Route::get('/operators', [AdminOperatorController::class, 'index']);
            Route::post('/operators', [AdminOperatorController::class, 'store']);
            Route::put('/operators/{id}/status', [AdminOperatorController::class, 'updateStatus']);
            Route::delete('/operators/{id}', [AdminOperatorController::class, 'destroy']);

            Route::get('/technical-team', [AdminTechnicalTeamController::class, 'index']);
            Route::post('/technical-team', [AdminTechnicalTeamController::class, 'store']);
            Route::put('/technical-team/{id}/status', [AdminTechnicalTeamController::class, 'updateStatus']);
            Route::delete('/technical-team/{id}', [AdminTechnicalTeamController::class, 'destroy']);

            // Super Agents CRUD
            Route::get('/super-agents', [AdminSuperAgentController::class, 'index']);
            Route::post('/super-agents', [AdminSuperAgentController::class, 'store']);
            Route::get('/super-agents/{id}', [AdminSuperAgentController::class, 'show']);
            Route::put('/super-agents/{id}', [AdminSuperAgentController::class, 'update']);
            Route::put('/super-agents/{id}/status', [AdminSuperAgentController::class, 'updateStatus']);
            Route::delete('/super-agents/{id}', [AdminSuperAgentController::class, 'destroy']);
            Route::post('/super-agents/{id}/regenerate-qr', [AdminSuperAgentController::class, 'regenerateQr']);
            Route::put('/super-agents/{id}/toggle-public-contact', [AdminSuperAgentController::class, 'togglePublicContact']);
            Route::get('/super-agents/{id}/qr-scans', [AdminSuperAgentController::class, 'getQrScans']);

            // Super Agent Team Assignment
            Route::get('/super-agents/{id}/agents', [AdminSuperAgentController::class, 'teamAgents']);
            Route::post('/super-agents/{id}/agents/assign', [AdminSuperAgentController::class, 'assignAgent']);
            Route::post('/super-agents/{id}/agents/assign-bulk', [AdminSuperAgentController::class, 'assignAgentsBulk']);
            Route::delete('/super-agents/{id}/agents/{agent_id}', [AdminSuperAgentController::class, 'unassignAgent']);
            Route::get('/super-agents/{id}/team-log', [AdminSuperAgentController::class, 'teamLog']);

            // Leads — Admin-only actions (assign, edit, document upload, override)
            Route::put('/leads/{ulid}', [AdminLeadController::class, 'update']);
            Route::put('/leads/{ulid}/assign', [AdminLeadController::class, 'assign']);
            Route::put('/leads/{ulid}/assign-super-agent', [AdminLeadController::class, 'assignSuperAgent']);
            Route::put('/leads/{ulid}/assign-technicians', [AdminLeadController::class, 'assignTechnicians']);
            Route::put('/leads/{ulid}/assign-agent', [AdminLeadController::class, 'assignAgent']);
            Route::put('/leads/{ulid}/override-verification', [AdminLeadController::class, 'overrideVerification']);
            Route::post('/leads/{ulid}/documents', [AdminLeadController::class, 'uploadDocument'])->middleware('throttle:30,1');

            // Commissions
            Route::get('/commissions', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'index']);
            Route::get('/commissions/summary', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'summary']);
            Route::post('/leads/{ulid}/commission/super-agent', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'enterSuperAgentCommission']);
            Route::post('/leads/{ulid}/commission/agent-direct', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'enterDirectAgentCommission']);
            Route::post('/leads/{ulid}/commission/enumerator', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'enterEnumeratorCommission']);
            Route::post('/leads/{ulid}/commission/enter', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'enterCommission']);
            Route::put('/commissions/{id}', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'update']);
            Route::put('/commissions/{id}/mark-paid', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'markPaid']);
            Route::get('/leads/{ulid}/commissions', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'getLeadCommissions']);
            Route::put('/leads/{ulid}/commission/admin-allocation', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'updateAdminAllocation']);
            Route::put('/leads/{ulid}/commission/admin-expenses', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'updateAdminExpenses']);
            Route::put('/leads/{ulid}/commission/system-revenue', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'updateSystemRevenue']);

            // Profit Ledger — unified financial view + CSV export
            Route::get('/commissions/profit-ledger', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'profitLedger']);
            Route::get('/commissions/profit-ledger/export', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'exportProfitLedger']);


            // Reports
            Route::get('/reports/pipeline', [AdminReportController::class, 'pipelineSummary']);
            Route::get('/reports/agent-performance', [AdminReportController::class, 'agentPerformance']);
            Route::get('/reports/geography', [AdminReportController::class, 'geographicDistribution']);
            Route::get('/reports/monthly-trend', [AdminReportController::class, 'monthlyTrend']);
            Route::get('/reports/super-agent-performance', [AdminReportController::class, 'superAgentPerformance']);

            // Route::get('/commission-slabs', [AdminCommissionSlabController::class, 'index']);

            // Withdrawals
            Route::get('/withdrawals', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'adminIndex']);
            Route::put('/withdrawals/{id}/approve', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'approve']);
            Route::put('/withdrawals/{id}/reject', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'reject']);
            Route::put('/withdrawals/{id}/mark-paid', [\App\Http\Controllers\Admin\WithdrawalRequestController::class, 'markPaid']);

            // Route::post('/commission-slabs', [AdminCommissionSlabController::class, 'store']);
            // Route::put('/commission-slabs/{id}', [AdminCommissionSlabController::class, 'update']);
            // Route::delete('/commission-slabs/{id}', [AdminCommissionSlabController::class, 'destroy']);

            // Incentive Offers v2
            Route::get('/offers/redemptions', [AdminOfferController::class, 'redemptions']);
            Route::get('/offers/all-points-leaderboard', [AdminOfferController::class, 'leaderboard']);
            Route::get('/offers/agents/{agent}/offers', [AdminOfferController::class, 'agentOffers']);
            Route::post('/offers/redemptions/{id}/approve', [AdminOfferController::class, 'approveRedemption']);
            Route::post('/offers/redemptions/{id}/deliver', [AdminOfferController::class, 'deliveredRedemption']);
            Route::post('/offers/redemptions/{id}/cancel', [AdminOfferController::class, 'cancelRedemption']);
            Route::get('/offers/{offer}/participants', [AdminOfferController::class, 'participants']);
            Route::get('/offers/absorbed-points', [AdminOfferController::class, 'absorbedPoints']);
            Route::post('/offers/absorbed-points/{absorbedPoint}/approve', [AdminOfferController::class, 'approveAbsorption']);
            Route::post('/offers/{offer}/trigger-expiry', [AdminOfferController::class, 'triggerExpiry']);
            Route::apiResource('offers', AdminOfferController::class);

            // Notifications
            Route::get('/notifications', [AdminNotificationController::class, 'index']);
            Route::put('/notifications/{id}/read', [AdminNotificationController::class, 'markAsRead']);
            Route::put('/notifications/mark-all-read', [AdminNotificationController::class, 'markAllRead']);

            // Settings — routes moved outside this prefix('admin') group to fix double-prefix bug
            // PUT /admin/settings is now defined above alongside the GET

            // Achievements (admin)
            Route::get('/achievements', [AchievementController::class, 'index']);
            Route::post('/achievements', [AchievementController::class, 'store']);
            Route::put('/achievements/{achievement}', [AchievementController::class, 'update']);
            Route::delete('/achievements/{achievement}', [AchievementController::class, 'destroy']);

            // Feedbacks (admin)
            Route::get('/feedbacks', [FeedbackController::class, 'index']);
            Route::post('/feedbacks/{feedback}/reply', [FeedbackController::class, 'reply']);
            Route::put('/feedbacks/{feedback}/toggle-publish', [FeedbackController::class, 'togglePublish']);
            Route::delete('/feedbacks/{feedback}', [FeedbackController::class, 'destroy']);

            // Media (admin)
            Route::get('/media', [MediaController::class, 'index']);
            Route::post('/media', [MediaController::class, 'store']);
            Route::patch('/media/{media}', [MediaController::class, 'update']); // PATCH for updates with files
            Route::delete('/media/{media}', [MediaController::class, 'destroy']);

            // Documents (admin)
            Route::get('/documents', [DocumentController::class, 'index']);
            Route::post('/documents', [DocumentController::class, 'store']);
            Route::patch('/documents/{document}', [DocumentController::class, 'update']);
            Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);



        });

        // ==============================
        // SUPER ADMIN ROUTES
        // ==============================
        Route::middleware(['super_admin', 'throttle:600,1'])->prefix('super-admin')->group(function () {
            Route::get('/dashboard/stats', [MonitoringController::class, 'stats']);

            // Monitoring Views
            Route::get('/monitor/super-agents', [MonitoringController::class, 'superAgents']);
            Route::get('/monitor/agents',       [MonitoringController::class, 'agents']);
            Route::get('/monitor/enumerators',  [MonitoringController::class, 'enumerators']);
            Route::get('/monitor/leads',        [MonitoringController::class, 'leads']);
            Route::put('/monitor/leads/{ulid}/assign-admin', [MonitoringController::class, 'assignAdmin']);


            // Admin Management
            Route::get('/admins', [AdminManagementController::class, 'index']);
            Route::post('/admins', [AdminManagementController::class, 'store']);
            Route::put('/admins/{id}', [AdminManagementController::class, 'update']);
            Route::delete('/admins/{id}', [AdminManagementController::class, 'destroy']);
            Route::put('/admins/{id}/status', [AdminManagementController::class, 'toggleStatus']);


            // Security Area (Requires OTP)
            Route::post('/security/send-otp', [\App\Http\Controllers\Auth\SecurityOtpController::class, 'sendOtp']);
            Route::post('/security/verify-otp', [\App\Http\Controllers\Auth\SecurityOtpController::class, 'verifyOtp']);
            Route::get('/security/check-status', [\App\Http\Controllers\Auth\SecurityOtpController::class, 'checkStatus']);

            // FAQ Management (Protected with OTP)
            Route::middleware('super_admin_security')->group(function () {
                Route::apiResource('faqs', SAFAQController::class);
                Route::patch('/faqs/{faq}/toggle-status', [SAFAQController::class, 'toggleStatus']);

                // CRM Options Management
                Route::apiResource('crm-options', \App\Http\Controllers\CrmOptionController::class);
            });

            // Consumer Governance (NO OTP required — operational actions)
            Route::get('/consumer-ratings', [MonitoringController::class, 'consumerRatings']);
            Route::get('/support-tickets', [MonitoringController::class, 'supportTickets']);
            Route::post('/leads/{ulid}/escalate-ticket', [MonitoringController::class, 'escalateTicket']);
            Route::post('/leads/{ulid}/resolve-ticket', [MonitoringController::class, 'resolveTicket']);

            // Commission Settlement (Super Admin pays Admins) - NO OTP REQUIRED
            Route::get('/commissions/summary', [MonitoringController::class, 'commissionsSummary']);
            Route::get('/commissions', [MonitoringController::class, 'commissionsList']);
            Route::put('/commissions/{id}/settle', [MonitoringController::class, 'settleCommission']);
            Route::get('/commissions/profit-ledger', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'profitLedger']);
            Route::get('/commissions/profit-ledger/export', [\App\Http\Controllers\Admin\AdminCommissionController::class, 'exportProfitLedger']);

            // ── Global Inventory Catalogue (SA-ONLY: Admins cannot create/modify global stock) ──
            Route::apiResource('inventory-items', \App\Http\Controllers\Admin\InventoryController::class);

            // ── SA → Admin Stock Dispatches ────────────────────────────────────────────────────
            Route::prefix('stock-dispatches')->group(function () {
                Route::get('/form-data', [\App\Http\Controllers\SuperAdmin\StockDispatchController::class, 'formData']);
                Route::get('/{id}',      [\App\Http\Controllers\SuperAdmin\StockDispatchController::class, 'show']);
                Route::get('/',          [\App\Http\Controllers\SuperAdmin\StockDispatchController::class, 'index']);
                Route::post('/',         [\App\Http\Controllers\SuperAdmin\StockDispatchController::class, 'store']);
            });

            // ── Admin Ledger Workflow ──────────────────────────────────────────────────────────
            Route::prefix('ledger')->group(function () {
                Route::put('/{id}/approve',   [AdminLedgerController::class, 'approve']);
                Route::put('/{id}/reject',    [AdminLedgerController::class, 'reject']);
                Route::put('/{id}/mark-paid', [AdminLedgerController::class, 'markPaid']);
            });
        });



        // ==============================
        // ADMIN + OPERATOR SHARED ROUTES
        // Operators can: view all leads, update lead status.
        // They CANNOT access the admin group above (no dashboard, agents, settings etc.)
        // ==============================
        Route::middleware(['admin_or_operator', 'throttle:300,1'])->prefix('admin')->group(function () {
            Route::get('/leads', [AdminLeadController::class, 'index']);
            Route::get('/leads/{ulid}', [AdminLeadController::class, 'show']);
            Route::get('/inventory-items', [\App\Http\Controllers\Admin\InventoryController::class, 'index']);
            Route::get('/monitor/leads', [MonitoringController::class, 'leads']);
            Route::get('/technical-team', [AdminTechnicalTeamController::class, 'index']);
            Route::post('/leads/{ulid}/delegate-ticket', [AdminLeadController::class, 'delegateTicket']);
            Route::post('/leads/{ulid}/resolve-ticket', [MonitoringController::class, 'resolveTicket']);

            // Read-only access for Operators to assign or view relationships
            Route::get('/super-agents', [AdminSuperAgentController::class, 'index']);
            Route::get('/super-agents/{id}', [AdminSuperAgentController::class, 'show']);

            // Inventory Ledger & Receipts
            Route::get('/inventory/my-stock',                       [\App\Http\Controllers\Admin\AdminInventoryController::class, 'index']);
            Route::get('/inventory/incoming',                       [\App\Http\Controllers\Admin\AdminInventoryController::class, 'incomingStock']);
            Route::post('/inventory/incoming/{id}/confirm',         [\App\Http\Controllers\Admin\AdminInventoryController::class, 'confirmReceipt']);

            // Inventory Powers (Shared with Operator)
            Route::get('/inventory/reversions/pending', [\App\Http\Controllers\Admin\InventoryController::class, 'reversionsPending']);
            Route::post('/inventory/reversions/{leadInventoryItemId}/confirm', [\App\Http\Controllers\Admin\InventoryController::class, 'confirmReversion']);

            // Phase 4: Admin Queues
            Route::get('/queue/registration', [\App\Http\Controllers\Admin\RegistrationQueueController::class, 'index']);
            Route::match(['post', 'put'], '/leads/{ulid}/register', [\App\Http\Controllers\Admin\RegistrationQueueController::class, 'register']);
            Route::match(['post', 'put'], '/leads/{ulid}/register/reject', [\App\Http\Controllers\Admin\RegistrationQueueController::class, 'reject']);

            Route::get('/queue/disbursement', [\App\Http\Controllers\Admin\DisbursementQueueController::class, 'index']);
            Route::post('/leads/{ulid}/disbursement/verify', [\App\Http\Controllers\Admin\DisbursementQueueController::class, 'verify']);
            Route::post('/leads/{ulid}/disbursement/reject', [\App\Http\Controllers\Admin\DisbursementQueueController::class, 'reject']);

            Route::get('/queue/installation', [\App\Http\Controllers\Admin\InstallationQueueController::class, 'index']);
            Route::post('/leads/{ulid}/installation/verify', [\App\Http\Controllers\Admin\InstallationQueueController::class, 'verify']);
            Route::post('/leads/{ulid}/installation/reject', [\App\Http\Controllers\Admin\InstallationQueueController::class, 'reject']);

            Route::get('/queue/pod', [\App\Http\Controllers\Admin\PodQueueController::class, 'index']);
            Route::post('/leads/{ulid}/pod/successful', [\App\Http\Controllers\Admin\PodQueueController::class, 'successful']);
            Route::post('/leads/{ulid}/pod/reject', [\App\Http\Controllers\Admin\PodQueueController::class, 'reject']);

            Route::post('/leads/{ulid}/dispatch', [\App\Http\Controllers\Admin\DispatchController::class, 'dispatchMaterial']);
            Route::post('/leads/{ulid}/dispatch/transit', [\App\Http\Controllers\Admin\DispatchController::class, 'markInTransit']);
            Route::post('/leads/{ulid}/dispatch/installer', [\App\Http\Controllers\Admin\InstallationQueueController::class, 'dispatchToInstaller']);
        });

        // ==============================
        // CONSUMER PORTAL ROUTES
        // ==============================

        Route::middleware(['auth:sanctum', 'consumer', 'throttle:60,1'])->prefix('consumer')->group(function () {
            Route::get('/dashboard', [\App\Http\Controllers\Consumer\ConsumerController::class, 'dashboard']);
            Route::post('/change-password', [\App\Http\Controllers\Consumer\ConsumerController::class, 'changePassword']);
            
            // Profile & Settings
            Route::post('/profile', [\App\Http\Controllers\Consumer\ConsumerController::class, 'updateProfile']);
            
            // Material
            Route::post('/acknowledge-material', [\App\Http\Controllers\Consumer\ConsumerController::class, 'acknowledgeMaterial']);
            Route::post('/verify-installer-material', [\App\Http\Controllers\Consumer\ConsumerController::class, 'verifyInstallerMaterialAtSite']);
            
            // Support
            Route::post('/support-ticket', [\App\Http\Controllers\Consumer\ConsumerController::class, 'supportTicket']);
            Route::get('/my-tickets', [\App\Http\Controllers\Consumer\ConsumerController::class, 'myTickets']);
            
            // Team & Ratings
            Route::get('/team', [\App\Http\Controllers\Consumer\ConsumerController::class, 'getTeam']);
            Route::post('/rate-team', [\App\Http\Controllers\Consumer\ConsumerController::class, 'rateTeam']);
        });
    });
});
