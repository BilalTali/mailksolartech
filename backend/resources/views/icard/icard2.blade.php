@php
    /** @var string|null $logoBase64 */
    /** @var string|null $sigBase64 */
    /** @var string|null $sealBase64 */
    /** @var string|null $globalLogoBase64 */
    /** @var string|null $globalSigBase64 */
    /** @var string|null $globalAffiliatedPartner */
    /** @var string|null $globalRegNo */
    /** @var string|null $globalName */
    /** @var string|null $profilePhotoBase64 */
    /** @var string|null $initials */
    /** @var string|null $designation */
    /** @var string|null $cardNumber */
    /** @var string|null $dob */
    /** @var string|null $joiningDate */
    /** @var string|null $mobile */
    /** @var string|null $address */
    /** @var string|null $barcodeBase64 */
    /** @var string|null $companyWebsite */
    /** @var string|null $companyAffiliatedWith */
    /** @var string|null $companyRegNo */
    /** @var string|null $qrBase64 */
    /** @var string|null $companyEmergency */
    /** @var string|null $icardVerifiedBy */
    /** @var string|null $companyAddress */
    /** @var string|null $companyPhone */
    /** @var string|null $companyEmail */
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ $companyName ?? 'iCard' }} — {{ isset($user) ? $user->name : 'User' }}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body, h1, h2, h3, p, span, div, strong, table, td, tr {
      font-family: Helvetica, Arial, sans-serif !important;
    }

    @page { size: 570pt 400pt; margin: 0; }

    html, body {
      margin: 0; padding: 0;
      width: 570pt; height: 400pt;
      background: #0d1b2a;
      overflow: hidden;
      line-height: 1;
    }

    .main-table {
      width: 560pt; height: 385pt;
      border-collapse: separate;
      border-spacing: 12pt 10pt;
      margin: 0; padding: 0;
    }

    .card-cell {
      width: 255pt; height: 360pt;
      vertical-align: top; padding: 0;
      position: relative;
    }

    .card-box {
      width: 255pt; height: 360pt;
      border-radius: 15pt;
      overflow: hidden;
      position: relative;
      box-sizing: border-box;
      border: 1pt solid #ff9500;
    }

    /* Info grid cells — generous padding fills vertical space */
    .info-cell {
      background: #FFF;
      border: 0.5pt solid rgba(4,17,31,0.08);
      border-left: 2pt solid #FF9500;
      border-radius: 4pt;
      padding: 6pt 6pt;
      vertical-align: top;
    }

    .lbl {
      color: #8a9bb0; font-size: 5.5pt; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.3pt; display: block;
      margin-bottom: 1pt;
    }

    .val {
      color: #04111F; font-size: 8.5pt; font-weight: 900;
      white-space: nowrap; overflow: hidden; display: block;
      line-height: 1.15;
    }

    .val-gold { color: #FF9500; }
  </style>
</head>
<body>
<table class="main-table"><tr>

  {{-- ══════════════════════════════════════════════════════════ --}}
  {{-- FRONT CARD                                               --}}
  {{-- ══════════════════════════════════════════════════════════ --}}
  <td class="card-cell">
  <div class="card-box">

    {{-- Background --}}
    <div style="background:#f5f3ee; position:absolute; top:0; left:0; width:100%; height:100%;"></div>

    {{-- Watermark (DOMPDF safe: explicit left, no transform) --}}
    @if($logoBase64)
      <img src="{{ $logoBase64 }}" style="position:absolute; top:125pt; left:37pt; width:180pt; height:180pt; opacity:0.04; z-index:1;" alt="">
    @endif

    {{-- ── Header ── --}}
    <div style="position:absolute; top:0; left:0; width:100%; height:145pt; background:#04111F; z-index:2;"></div>
    <div style="position:absolute; top:143pt; left:0; width:100%; height:2pt; background:#FF9500; z-index:3;"></div>
    <div style="position:absolute; top:122pt; left:-20pt; width:295pt; height:40pt; background:#f5f3ee; border-radius:100% 100% 0 0; z-index:3;"></div>

    {{-- ── Front Header: Side-by-Side branding (matches index.blade.php variables) ── --}}
    <div style="position:absolute; top:8pt; left:12pt; width:231pt; z-index:10;">
      {{-- Logo Box --}}
      <div style="float:left; width:38pt; height:38pt; background:#FF9500; border-radius:8pt; overflow:hidden; border:1pt solid rgba(255,255,255,0.1);">
        @if($logoBase64)
          <img src="{{ $logoBase64 }}" style="width:38pt; height:38pt; display:block;" alt="Logo">
        @endif
      </div>

      {{-- Brand Text --}}
      <div style="margin-left:46pt; padding-top:2pt;">
        <div style="color:#FFF; font-size:10.5pt; font-weight:900; letter-spacing:0.5pt; line-height:1.2; text-transform:uppercase; text-shadow:1pt 1pt 2pt rgba(0,0,0,0.3);">
          @if($companyName)
            {{ $companyName }}
          @elseif(isset($globalName))
            {{ $globalName }}
          @endif
        </div>
        @if(!empty($affiliatedPartner))
          <div style="color:#FF9500; font-size:6pt; margin-top:2pt; font-weight:800; text-transform:uppercase; letter-spacing:0.4pt; opacity:0.95;">
            Affiliated with: {{ $affiliatedPartner }}
          </div>
        @endif
      </div>
      <div style="clear:both;"></div>
    </div>

    {{-- Profile Photo --}}
    <div style="position:absolute; top:48pt; left:87.5pt; width:80pt; height:80pt; z-index:20;">
      <div style="width:80pt; height:80pt; border-radius:40pt; background:#FF9500; padding:3pt; box-sizing:border-box;">
        @if($profilePhotoBase64)
          <img src="{{ $profilePhotoBase64 }}" style="width:74pt; height:74pt; border-radius:37pt; border:2pt solid #04111F; display:block;" alt="Photo">
        @else
          <div style="width:74pt; height:74pt; border-radius:37pt; border:2pt solid #04111F; background:#0a1f35; text-align:center; line-height:74pt; color:#FF9500; font-size:22pt; font-weight:900;">
            {{ $initials ?? 'SM' }}
          </div>
        @endif
      </div>
    </div>

    {{-- Designation badge --}}
    <div style="position:absolute; top:124pt; left:67.5pt; width:120pt; background:#FF9500; color:#04111F; text-align:center; padding:4pt 0; border-radius:15pt; font-size:7.5pt; font-weight:900; text-transform:uppercase; z-index:30; letter-spacing:0.8pt;">
      {{ $designation ?? 'Administrator' }}
    </div>

    {{-- Name — Title Case, not all caps --}}
    <div style="position:absolute; top:153pt; left:0; width:100%; text-align:center; font-size:14pt; font-weight:900; color:#04111F; text-transform:capitalize; letter-spacing:0.3pt; z-index:10;">
      {{ $user->name ?? 'User Name' }}
    </div>

    {{-- Divider --}}
    <div style="position:absolute; top:171pt; left:0; width:100%; text-align:center; z-index:10;">
      <div style="display:inline-block; width:215pt; height:1pt; background:#FF9500; opacity:0.35; position:relative;">
        <div style="position:absolute; top:-2.5pt; left:105pt; width:5pt; height:5pt; background:#FF9500; border-radius:2.5pt;"></div>
      </div>
    </div>

    {{-- Info Grid --}}
    <table style="position:absolute; top:179pt; left:8pt; width:239pt; z-index:10; border-collapse:separate; border-spacing:2pt 3pt;">
      <tr>
        <td class="info-cell">
          <span class="lbl">Employee ID</span>
          <span class="val val-gold">{{ $cardNumber ?? 'ADM-0002' }}</span>
        </td>
        <td class="info-cell">
          <span class="lbl">Date of Birth</span>
          <span class="val">{{ $dob ?? 'N/A' }}</span>
        </td>
      </tr>
      <tr>
        <td class="info-cell">
          <span class="lbl">Father's Name</span>
          <span class="val">{{ $user->father_name ?? 'N/A' }}</span>
        </td>
        <td class="info-cell">
          <span class="lbl">Joining Date</span>
          <span class="val">{{ $joiningDate ?? 'N/A' }}</span>
        </td>
      </tr>
      <tr>
        <td class="info-cell">
          <span class="lbl">Contact</span>
          <span class="val">{{ $mobile ?? 'N/A' }}</span>
        </td>
        <td class="info-cell">
          <span class="lbl">Address</span>
          <span class="val" style="font-size:6.5pt; white-space:normal; line-height:1.2;">{{ $address ?? 'N/A' }}</span>
        </td>
      </tr>
    </table>

    {{-- Barcode — left side --}}
    <div style="position:absolute; top:296pt; left:8pt; width:130pt; z-index:10;">
      @if($barcodeBase64)
        <img src="{{ $barcodeBase64 }}" style="height:22pt; width:120pt; display:block;" alt="Barcode">
      @endif
      <div style="color:#8a9bb0; font-size:6pt; margin-top:2pt; font-weight:bold; letter-spacing:0.3pt;">{{ $cardNumber ?? 'ADM-0002' }}</div>
    </div>

    {{--
      Front Footer Right: Seal and Sig over Verified Identity text.
      Aligned to match the 'Verified By' logic on the back side.
    --}}
    <div style="position:absolute; bottom:25pt; right:12pt; width:110pt; text-align:center; z-index:15;">
      <div style="position:relative; height:32pt; width:100%; display:block;">
        @if($sealBase64)
          <img src="{{ $sealBase64 }}" style="position:absolute; width:44pt; height:44pt; right:35pt; top:-12pt; opacity:0.15; z-index:5;" alt="Seal">
        @endif
        @if($sigBase64)
          <img src="{{ $sigBase64 }}" style="position:absolute; width:44pt; height:auto; right:8pt; top:0pt; z-index:15;" alt="Signature">
        @endif
      </div>
      <div style="width:90pt; height:0.5pt; background:#FF9500; opacity:0.4; margin:2pt auto;"></div>
      <div style="font-size:7.5pt; font-weight:900; color:#FF9500; text-transform:uppercase; letter-spacing:0.3pt;">
        <span style="display:inline-block; width:4pt; height:4pt; border-radius:2pt; background:#28a745; margin-right:3pt; vertical-align:middle;"></span>Verified Identity
      </div>
    </div>

    <div style="position:absolute; bottom:0; left:0; width:100%; height:20pt; background:#f0ede6; border-top:1pt solid rgba(255,149,0,0.3); z-index:9;"></div>

    <div style="position:absolute; bottom:5pt; left:12pt; font-size:6pt; color:#8a9bb0; z-index:10;">
      {{ $companyWebsite }}
    </div>

  </div>
  </td>

  {{-- ══════════════════════════════════════════════════════════ --}}
  {{-- BACK CARD                                                --}}
  {{-- ══════════════════════════════════════════════════════════ --}}
  <td class="card-cell">
  <div class="card-box">

    {{-- Background --}}
    <div style="background:#04111F; position:absolute; top:0; left:0; width:100%; height:100%;"></div>

    {{-- Watermark on dark bg (explicit left position, no transform) --}}
    @if($globalLogoBase64)
      <img src="{{ $globalLogoBase64 }}" style="position:absolute; top:125pt; left:37pt; width:180pt; height:180pt; opacity:0.05; z-index:1;" alt="">
    @endif

    {{-- ── Back Header: Side-by-Side branding (matches index.blade.php variables) ── --}}
    <div style="position:absolute; top:15pt; left:12pt; width:231pt; z-index:10;">
      {{-- Logo Box --}}
      <div style="float:left; width:38pt; height:38pt; background:#FF9500; border-radius:8pt; overflow:hidden; border:1pt solid rgba(255,255,255,0.1);">
        @if($globalLogoBase64)
          <img src="{{ $globalLogoBase64 }}" style="width:38pt; height:38pt; display:block;" alt="Logo">
        @endif
      </div>

      {{-- Brand Text --}}
      <div style="margin-left:48pt; padding-top:4pt;">
        <div style="color:#FF9500; font-size:11pt; font-weight:900; letter-spacing:0.6pt; line-height:1.2; text-transform:uppercase; text-shadow:1pt 1pt 2pt rgba(0,0,0,0.3);">
          @if($globalAffiliatedPartner)
            {{ $globalAffiliatedPartner }}
          @elseif($globalName)
            {{ $globalName }}
          @endif
        </div>
        @if(!empty($globalRegNo))
          <div style="color:#FFF; font-size:6.5pt; margin-top:3pt; font-weight:800; text-transform:uppercase; letter-spacing:0.5pt; opacity:0.85;">
            Reg No: {{ $globalRegNo }}
          </div>
        @endif
      </div>
      <div style="clear:both;"></div>

      {{-- Accent Line --}}
      <div style="width:100%; height:1.5pt; background:linear-gradient(to right, #FF9500, transparent); margin-top:8pt; opacity:0.6;"></div>
    </div>

    {{-- QR Code — moved back up as header is now compact side-by-side --}}
    <div style="position:absolute; top:65pt; left:0; width:100%; text-align:center; z-index:10;">
      <div style="display:inline-block; background:#FFF; padding:8pt; border-radius:10pt; border:2pt solid #FF9500;">
        @if($qrBase64)
          <img src="{{ $qrBase64 }}" style="width:82pt; height:82pt;" alt="QR">
        @endif
      </div>
      <div style="color:#8a9bb0; font-size:7pt; font-weight:800; text-transform:uppercase; margin-top:5pt; letter-spacing:0.5pt;">Scan to Verify</div>
    </div>

    {{-- Notice --}}
    <div style="position:absolute; top:195pt; left:20pt; width:215pt; background:rgba(255,149,0,0.04); border:0.5pt solid rgba(255,149,0,0.15); border-radius:8pt; padding:8pt; text-align:center; z-index:10;">
      <p style="color:#c8d8e8; font-size:6.5pt; line-height:1.45; margin:0;">
        {!! nl2br(e($icardWarningText)) !!}
      </p>
    </div>

    {{-- Emergency --}}
    <div style="position:absolute; top:263pt; left:47.5pt; width:160pt; border:1.2pt solid #FF9500; border-radius:18pt; padding:5pt 0; text-align:center; color:#FF9500; font-size:8.5pt; font-weight:900; letter-spacing:0.5pt; z-index:10;">
      Emergency: {{ $companyEmergency ?? '9906766655' }}
    </div>

    {{-- Back: Seal overlaid on Signature — Sig over Seal (z-index) --}}
    <div style="position:absolute; top:283pt; left:12pt; width:231pt; border-top:0.5pt solid rgba(255,149,0,0.15); text-align:center; z-index:10; padding-top:5pt;">

      {{-- Wrapper: relative, fixed height 32pt --}}
      <div style="position:relative; height:32pt; width:100pt; display:inline-block;">
        @if($sealBase64)
          <img src="{{ $sealBase64 }}" style="position:absolute; width:38pt; height:38pt; left:24pt; top:-8pt; opacity:0.15; z-index:5;" alt="Seal">
        @endif
        @if($sigBase64)
          <img src="{{ $sigBase64 }}" style="position:absolute; width:38pt; height:auto; left:36pt; top:2pt; z-index:15;" alt="Signature">
        @endif
      </div>

      {{-- Thin line --}}
      <div style="width:100pt; height:0.5pt; background:#FF9500; opacity:0.4; margin:0 auto;"></div>

      {{-- Label --}}
      <div style="font-size:5pt; color:#8a9bb0; text-transform:uppercase; margin-top:3pt; font-weight:800; line-height:1.4; letter-spacing:0.3pt;">
        Verified By &nbsp;|&nbsp; {{ $icardVerifiedBy ?? 'CHIEF OPERATIONS OFFICER' }}
      </div>

    </div>

    {{-- Back Footer — address + contact pinned to bottom --}}
    <div style="position:absolute; bottom:8pt; left:0; width:100%; text-align:center; z-index:10;">
      <div style="color:#8a9bb0; font-size:6pt; font-weight:700; line-height:1.6;">
        {{ $companyAddress ?? 'Srinagar, Jammu & Kashmir' }}
      </div>
      <div style="color:#7a8ea0; font-size:6pt; line-height:1.5;">
        +91-{{ $companyPhone ?? '9797287817' }} &nbsp;|&nbsp; {{ $companyEmail ?? 'info@andleebsurya.in' }}
      </div>
    </div>

  </div>
  </td>

</tr></table>
</body>
</html>
