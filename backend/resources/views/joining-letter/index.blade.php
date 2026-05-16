@php
    /** @var \App\Models\User $user */
    /** @var string $companyName */
    /** @var string $companyTagline */
    /** @var string $companyAddress */
    /** @var string|null $companyAffiliatedWith */
    /** @var string $companyPhone */
    /** @var string $companyEmail */
    /** @var string $companyWebsite */
    /** @var string $letterNumber */
    /** @var string|null $barcodeBase64 */
    /** @var string|null $qrBase64 */
    /** @var string $designation */
    /** @var string $body */
    /** @var array $terms */
    /** @var string|null $logoBase64 */
    /** @var string|null $logoBase64_2 */
    /** @var string|null $sigBase64 */
    /** @var string $authorizedSignatory */
    /** @var string $signatoryTitle */
    /** @var array $settings */
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Appointment Letter - {{ isset($user) ? $user->name : 'User' }}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt; /* SLIGHTLY REDUCED FROM 9.5pt */
            line-height: 1.4; /* SLIGHTLY REDUCED FROM 1.5 */
            color: #04111F;
            margin: 0;
            padding: 0.8cm 1.5cm; /* SLIGHTLY REDUCED TOP PADDING TO FIT PAGE */
            background: #fff;
        }
        .company-name {
            font-family: 'Times New Roman', serif;
            font-size: 22pt; /* SLIGHTLY REDUCED FROM 24pt */
            font-weight: bold;
            color: #0A1931;
            text-transform: uppercase;
            margin: 0;
            padding: 0;
            line-height: 1;
            letter-spacing: 2px;
        }
        
        .company-tagline {
            font-size: 8.5pt; /* REDUCED FROM 9pt */
            font-weight: bold;
            color: #F7B100;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 4px;
        }

        .affiliation-partner {
            font-size: 8pt;
            color: #64748B;
            font-weight: bold;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .company-contact {
            margin-top: 8px;
            font-size: 8pt;
            color: #475569;
            line-height: 1.3;
        }

        .metadata-table {
            width: 100%;
            margin-bottom: 15px; /* REDUCED FROM 20px */
            font-size: 9pt; /* REDUCED FROM 9.5pt */
        }

        .meta-label {
            font-weight: bold;
            color: #4A5568;
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 8.5pt;
            text-transform: uppercase;
        }
        .salutation {
            margin-bottom: 12px; /* REDUCED FROM 20px */
        }
        .subject {
            text-align: center;
            margin: 10px 0; /* REDUCED FROM 12px */
            font-weight: bold;
            font-size: 10pt; /* REDUCED FROM 10.5pt */
            text-decoration: underline;
            text-transform: uppercase;
            line-height: 1.3;
            color: #0A1931;
        }
        .content {
            text-align: justify;
            margin-bottom: 10px; /* REDUCED FROM 12px */
            clear: both;
        }

        .terms-box {
            background: #F8FAFC;
            padding: 8px 12px;
            border-radius: 8px;
            border-left: 3px solid #0A1931;
            margin: 10px 0; /* REDUCED FROM 12px */
        }

        .terms-title {
            font-family: 'Helvetica', Arial, sans-serif;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 9pt;
            text-transform: uppercase;
            color: #0A1931;
        }
        .terms-list {
            padding-left: 18px;
            margin: 0;
            font-size: 8.5pt;
        }
        .terms-list li {
            margin-bottom: 3px; /* REDUCED FROM 4px */
            text-align: justify;
        }
        
        .signature-section {
            margin-top: 15px; /* REDUCED FROM 25px */
            width: 100%;
            height: 100px; /* REDUCED FROM 110px */
        }

        .sig-container {
            float: right;
            width: 250px;
            text-align: center;
            position: relative;
        }

        .sig-image {
            max-width: 150px; /* REDUCED FROM 160px */
            max-height: 60px; /* REDUCED FROM 70px */
        }
        
        .seal-image {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            height: 85px; /* REDUCED FROM 90px */
            width: auto;
            opacity: 0.8;
            z-index: 5;
        }

        .sig-name {
            font-weight: bold;
            font-size: 10pt; /* REDUCED FROM 11pt */
            margin: 0;
            color: #0A1931;
        }

        .sig-title {
            font-size: 8.5pt; /* REDUCED FROM 9pt */
            color: #64748B;
            text-transform: uppercase;
            font-family: 'Helvetica', Arial, sans-serif;
            font-weight: 700;
        }
        
        .footer {
            position: absolute;
            bottom: 0.8cm; /* TIGHTENED FROM 1.4cm TO AVOID PAGE BREAK */
            left: 1.5cm; /* MATCH BODY PADDING */
            right: 1.5cm; /* MATCH BODY PADDING */
            text-align: center;
            font-size: 7.5pt;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 8px; /* TIGHTENED FROM 10px */
            font-family: 'Helvetica', Arial, sans-serif;
        }
        
        .footer-note {
            margin-bottom: 4px;
        }
        
        .footer-site {
            font-weight: 700;
            color: #0A1931;
            text-transform: lowercase;
            letter-spacing: 0.5px;
        }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 100pt;
            font-weight: 900;
            color: rgba(226, 232, 240, 0.15);
            z-index: -1;
            white-space: nowrap;
            font-family: 'Helvetica', Arial, sans-serif;
            text-transform: uppercase;
            pointer-events: none;
        }

        .barcode-container {
            margin-top: 8px;
        }
        .barcode-img {
            height: 28px;
            width: auto;
        }
        .qr-section {
            text-align: right;
            margin-top: 10px; /* WAS INLINE BEFORE */
        }
        .qr-img {
            width: 80px; /* REDUCED FROM 85px */
            height: 80px; /* REDUCED FROM 85px */
            border: 1px solid #E2E8F0;
            padding: 4px;
            border-radius: 8px;
            background: white;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .verification-text {
            font-size: 7pt;
            color: #64748B;
            margin-top: 4px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

    </style>
</head>
<body>
    <div class="watermark">{{ $companyName }}</div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 15px; border-bottom: 2.5px solid #0A1931; padding-bottom: 10px;">
        <tr>
            <td width="20%" valign="middle" align="left">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" style="max-width: 80px; max-height: 80px;" alt="Primary Logo">
                @endif
            </td>
            <td width="60%" valign="middle" align="center">
                <h1 class="company-name">{{ $companyName }}</h1>
                <div class="company-tagline">{{ $companyTagline }}</div>
                <div class="affiliation-partner">AN AFFILIATION PARTNER OF {{ $globalName }}</div>
            </td>
            <td width="20%" valign="middle" align="right">
                @if($logoBase64_2)
                    <img src="{{ $logoBase64_2 }}" style="max-width: 80px; max-height: 80px;" alt="Secondary Logo">
                @endif
            </td>
        </tr>
    </table>

    <table class="metadata-table" cellspacing="0" cellpadding="0">
        <tr>
            <td width="60%">
                <span class="meta-label">Letter No:</span> <strong>{{ $letterNumber }}</strong>
                @if($barcodeBase64)
                    <div class="barcode-container">
                        <img src="{{ $barcodeBase64 }}" class="barcode-img">
                    </div>
                @endif
            </td>
            <td width="40%" align="right" valign="top">
                <span class="meta-label">Date:</span> <strong>{{ ($user->approved_at ?? null) ? $user->approved_at->format('d F, Y') : date('d F, Y') }}</strong>
                @if($qrBase64)
                    <div class="qr-section">
                        <img src="{{ $qrBase64 }}" class="qr-img">
                        <div class="verification-text">Scan to Verify</div>
                    </div>
                @endif
            </td>
        </tr>
    </table>


    <div class="salutation">
        To,<br>
        <strong>{{ $user->name ?? 'N/A' }}</strong><br>
        {{ ($user->current_address ?? $user->area ?? 'N/A') }}<br>
        Contact: {{ $user->mobile ?? 'N/A' }}
    </div>

    <div class="subject">
        Subject: Letter of Appointment as {{ $designation }}
    </div>

    <div class="content">
        Dear {{ explode(' ', $user->name ?? 'User')[0] }},<br><br>
        Following your successful application and subsequent evaluation, we are pleased to appoint you as <strong>{{ $designation }}</strong> at <strong>{{ $companyName }}</strong>.
    </div>

    <div class="content">
        {!! $body !!}
    </div>

    <div class="terms-box">
        <div class="terms-title">Standard Terms & Conditions</div>
        <ul class="terms-list">
            @foreach($terms as $term)
                <li>{{ $term }}</li>
            @endforeach
        </ul>
    </div>

    <div class="content">
        We welcome you to the <strong>{{ $companyName }}</strong> family and are confident that your contribution will be instrumental in our mission. We look forward to a mutually beneficial association.
    </div>


    <div class="signature-section">
        <div class="sig-container">
            <div style="position: relative; padding: 10px 0;">
                @if($sealBase64)
                    <img src="{{ $sealBase64 }}" class="seal-image" style="width: 100px; height: 100px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: 0.3; z-index: 5;">
                @endif
                @if($sigBase64)
                    <img src="{{ $sigBase64 }}" class="sig-image" style="width: 140px; height: auto; position: relative; z-index: 10;">
                @endif
            </div>
            <div class="sig-name" style="margin-top: 5px; border-top: 1px solid #E2E8F0; padding-top: 5px;">{{ $authorizedSignatory }}</div>
            <div class="sig-title">{{ $signatoryTitle }}</div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-note">{{ $settings['letter_footer_note'] ?? 'This is a computer-generated document and carries a digital signature for authenticity.' }}</div>
        <div class="footer-site">Website: {{ $companyWebsite ?? 'suryamitra.in' }}</div>
    </div>
</body>
</html>
