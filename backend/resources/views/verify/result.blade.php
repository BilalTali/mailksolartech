@php
  /** @var \App\Models\User|null $user */
  /** @var bool $isActive */
  /** @var bool $isSuspended */
  /** @var string $cardNumber */
  /** @var string $designation */
  /** @var string $scannedAt */
  /** @var string $initials */
  /** @var string|null $fatherName */
  /** @var string|null $dob */
  /** @var string|null $bloodGroup */
  /** @var string|null $mobile */
  /** @var string|null $clearance */
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>Agent Verification — SuryaMitra</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #04111F;
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 0 60px;
    }

    /* ── Header bar ── */
    .header {
      width: 100%;
      background: #0A3D7A;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 3px solid #FF9500;
    }
    .header-logo {
      width: 36px; height: 36px;
      background: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800;
      color: #0A3D7A; font-family: 'Cinzel', serif;
      flex-shrink: 0;
    }
    .header-title { color: white; }
    .header-org {
      font-family: 'Cinzel', serif;
      font-size: 13px; font-weight: 700;
      letter-spacing: 1px; line-height: 1.2;
    }
    .header-sub {
      font-size: 10px; color: rgba(255,255,255,0.6);
      letter-spacing: 0.5px; margin-top: 1px;
    }

    /* ── Status banner ── */
    .status-banner {
      width: calc(100% - 32px); max-width: 420px;
      margin: 24px 16px 0;
      padding: 18px 20px;
      border-radius: 12px;
      display: flex; align-items: center; gap: 16px;
    }
    .status-banner.active {
      background: rgba(29,185,84,0.12);
      border: 1.5px solid rgba(29,185,84,0.35);
    }
    .status-banner.suspended {
      background: rgba(239,68,68,0.12);
      border: 1.5px solid rgba(239,68,68,0.35);
    }
    .status-icon {
      width: 52px; height: 52px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; flex-shrink: 0;
    }
    .status-icon.active   { background: rgba(29,185,84,0.2); color: #1DB954; }
    .status-icon.suspended{ background: rgba(239,68,68,0.2); color: #EF4444; }
    .status-headline {
      font-size: 17px; font-weight: 700;
      line-height: 1.2; margin-bottom: 3px;
    }
    .status-headline.active   { color: #1DB954; }
    .status-headline.suspended{ color: #EF4444; }
    .status-sub {
      font-size: 11.5px; color: rgba(255,255,255,0.5); line-height: 1.5;
    }

    /* ── Card ── */
    .card {
      width: calc(100% - 32px); max-width: 420px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      margin: 16px 16px 0;
      overflow: hidden;
    }

    /* Profile row */
    .profile-row {
      display: flex; gap: 16px; align-items: center;
      padding: 20px 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .avatar {
      width: 64px; height: 64px; border-radius: 50%;
      flex-shrink: 0; overflow: hidden;
      border: 2px solid #FF9500;
      box-shadow: 0 0 0 4px rgba(255,149,0,0.15);
      background: linear-gradient(145deg, #0D4F9E, #071E3D);
      display: flex; align-items: center; justify-content: center;
    }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .avatar-initials {
      font-family: 'Cinzel', serif;
      font-size: 20px; font-weight: 700; color: #FF9500;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .profile-info {}
    .profile-name {
      font-family: 'Cinzel', serif;
      font-size: 17px; font-weight: 700;
      color: white; letter-spacing: 1px;
      text-transform: uppercase; line-height: 1.2;
    }
    .profile-designation {
      font-size: 10.5px; color: #FF9500;
      letter-spacing: 1.5px; text-transform: uppercase;
      margin-top: 4px; font-weight: 600;
    }
    .profile-code {
      display: inline-block;
      background: #0A3D7A; color: white;
      font-family: 'Cinzel', serif;
      font-size: 10px; font-weight: 700;
      letter-spacing: 1.5px;
      padding: 2px 10px; border-radius: 4px; margin-top: 6px;
    }

    /* Info rows */
    .info-list { padding: 4px 20px 12px; }
    .info-item {
      display: flex; align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      gap: 12px;
    }
    .info-item:last-child { border-bottom: none; }
    .info-icon {
      width: 28px; height: 28px;
      background: rgba(10,61,122,0.5);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; flex-shrink: 0;
    }
    .info-label {
      font-size: 9.5px; font-weight: 600;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.6px;
      line-height: 1; margin-bottom: 4px;
    }
    .info-value {
      font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85);
    }

    /* Super agent section */
    .sa-section {
      width: calc(100% - 32px); max-width: 420px;
      margin: 12px 16px 0;
      padding: 12px 16px;
      background: rgba(255,149,0,0.07);
      border: 1px solid rgba(255,149,0,0.2);
      border-radius: 12px;
    }
    .sa-label {
      font-size: 9px; font-weight: 700; color: #FF9500;
      letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;
    }
    .sa-name { font-size: 13px; font-weight: 700; color: white; }
    .sa-code { font-size: 10px; color: rgba(255,255,255,0.45); margin-top: 2px; }

    /* Scan info */
    .scan-info {
      width: calc(100% - 32px); max-width: 420px;
      margin: 16px 16px 0;
      padding: 10px 16px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      font-size: 10px; color: rgba(255,255,255,0.3);
      text-align: center; line-height: 1.7;
    }

    /* Footer */
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 10px; color: rgba(255,255,255,0.18);
      line-height: 1.8;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-logo">☀</div>
    <div class="header-title">
      <div class="header-org">SURYAMITRA SOLAR NETWORK</div>
      <div class="header-sub">Agent Identity Verification</div>
    </div>
  </div>

  <!-- Status banner -->
  <div class="status-banner {{ $isActive ? 'active' : 'suspended' }}">
    <div class="status-icon {{ $isActive ? 'active' : 'suspended' }}">
      {{ $isActive ? '✓' : '✕' }}
    </div>
    <div class="status-text-block">
      <div class="status-headline {{ $isActive ? 'active' : 'suspended' }}">
        {{ $isActive ? 'VERIFIED — ACTIVE AGENT' : 'ACCOUNT SUSPENDED' }}
      </div>
      <div class="status-sub">
        @if($isActive)
          This person is an authorized SuryaMitra agent.
        @else
          This agent's account is currently inactive. Do not proceed.
        @endif
      </div>
    </div>
  </div>

  <!-- Profile card -->
  <div class="card">
    <div class="profile-row">
      <div class="avatar">
        @if($user?->profile_photo && file_exists(storage_path('app/public/' . $user->profile_photo)))
          <img src="{{ asset('storage/' . $user->profile_photo) }}" alt="{{ $user->name }}">
        @else
          <div class="avatar-initials">{{ $initials }}</div>
        @endif
      </div>
      <div class="profile-info">
        <div class="profile-name">{{ $user?->name }}</div>
        <div class="profile-designation">{{ $designation }}</div>
        <div class="profile-code">{{ $cardNumber }}</div>
      </div>
    </div>

    <div class="info-list">
      <div class="info-item">
        <div class="info-icon">📍</div>
        <div>
          <div class="info-label">District / State</div>
          <div class="info-value">{{ $user?->district }}, {{ $user?->state }}</div>
        </div>
      </div>

      <div class="info-item">
        <div class="info-icon">🛡</div>
        <div>
          <div class="info-label">Security Clearance</div>
          <div class="info-value">{{ $clearance }}</div>
        </div>
      </div>

      @if($user?->territory)
      <div class="info-item">
        <div class="info-icon">🗺</div>
        <div>
          <div class="info-label">Assigned Territory</div>
          <div class="info-value">{{ $user?->territory }}</div>
        </div>
      </div>
      @endif

      <div class="info-item">
        <div class="info-icon">👤</div>
        <div>
          <div class="info-label">Father's Name</div>
          <div class="info-value">{{ $fatherName }}</div>
        </div>
      </div>

      <div class="info-item">
        <div class="info-icon">🎂</div>
        <div>
          <div class="info-label">Date of Birth</div>
          <div class="info-value">{{ $dob }}</div>
        </div>
      </div>

      <div class="info-item">
        <div class="info-icon">🩸</div>
        <div>
          <div class="info-label">Blood Group</div>
          <div class="info-value">{{ $bloodGroup }}</div>
        </div>
      </div>

      <div class="info-item">
        <div class="info-icon">📞</div>
        <div>
          <div class="info-label">Mobile Number</div>
          <div class="info-value">{{ $mobile }}</div>
        </div>
      </div>

      <div class="info-item">
        <div class="info-icon">📅</div>
        <div>
          <div class="info-label">Member Since</div>
          <div class="info-value">
            {{ $user?->joining_date
              ? $user->joining_date->format('d M Y')
              : ($user?->approved_at ? $user->approved_at->format('d M Y') : 'N/A') }}
          </div>
        </div>
      </div>

      <div class="info-item">
        <div class="info-icon">🔐</div>
        <div>
          <div class="info-label">Account Status</div>
          <div class="info-value" style="color: {{ $isActive ? '#1DB954' : '#EF4444' }}; font-weight:700;">
            {{ strtoupper($user?->status ?? '') }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Super agent info (if agent has SA) -->
  @if($user?->isAgent() && $user->superAgent)
  <div class="sa-section">
    <div class="sa-label">Reporting Manager (BDM)</div>
    <div class="sa-name">{{ $user?->superAgent?->name }}</div>
    <div class="sa-code">{{ $user?->superAgent?->super_agent_code }}</div>
  </div>
  @endif

  <!-- Scan info -->
  <div class="scan-info">
    Verified on: {{ $scannedAt }}<br>
    This is a live verification powered by SuryaMitra Portal
  </div>

  <div class="footer">
    SuryaMitra Solar Network<br>
    PM Surya Ghar Muft Bijli Yojana — Facilitation Partner<br>
    suryamitra.in
  </div>

</body>
</html>
