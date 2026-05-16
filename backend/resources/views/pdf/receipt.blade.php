<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Payment Receipt - {{ $receiptSerial }}</title>
    <style>
        @page {
            size: A4;
            margin: 1.2cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            color: #2D3436;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .serif { font-family: 'Times New Roman', Times, serif; }

        table {
            width: 100%;
            border-collapse: collapse;
        }
        .rupee-icon {
            width: 13pt;
            height: 13pt;
            vertical-align: middle;
            margin-right: 2px;
        }
        
        /* Professional Designer Header */
        .brand-container {
            border-bottom: 2px solid #A68636;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .company-brand {
            font-family: 'DejaVu Serif', serif;
            font-size: 20pt;
            text-transform: uppercase;
            letter-spacing: 6px;
            font-weight: normal;
            color: #1a1a1a;
            margin: 0;
            line-height: 1.2;
        }
        .company-contact { text-align: right; font-size: 7.5pt; color: #636E72; line-height: 1.5; text-transform: uppercase; letter-spacing: 0.5px; }

        .doc-title-bar {
            text-align: center;
            margin: 15px 0;
        }
        .doc-title {
            font-family: 'DejaVu Serif', serif;
            font-size: 15pt;
            text-transform: uppercase;
            letter-spacing: 12px;
            color: #444;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            padding: 12px 0;
            font-weight: normal;
        }

        .receipt-card {
            margin: 10px 0;
            padding: 20px;
            border: 1px solid #f4f4f4;
            background-color: #fdfdfd;
        }

        .hero-amount {
            font-family: 'DejaVu Serif', serif;
            font-size: 34pt;
            font-weight: bold;
            color: #A68636;
            text-align: center;
            margin: 15px 0;
            border-top: 0.5px solid #eee;
            border-bottom: 0.5px solid #eee;
            padding: 10px 0;
        }

        .detail-group { margin-bottom: 25px; border-bottom: 1px solid #f9f9f9; padding-bottom: 10px; }
        .label {
            display: block;
            font-size: 7.5pt;
            font-weight: bold;
            color: #A68636;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 5px;
        }
        .value { font-size: 12.5pt; color: #1a1a1a; font-weight: bold; }
        
        .signature-box {
            text-align: center;
            width: 220px;
            margin-left: auto;
            margin-top: 30px;
        }
        .signature-img {
            max-height: 55px;
            mix-blend-mode: multiply;
            filter: contrast(1.3) brightness(1.05);
            margin-bottom: 8px;
        }
        .sig-line {
            border-top: 1.5px solid #1a1a1a;
            padding-top: 8px;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        @php
            $rupeeSvg = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI0IDhoLTQuMDNhMSAxIDAgMCAwLTEtMWg1LjAzYTEgMSAwIDAgMCAwLTJIOWExIDEtMCAwIDAgMCAyaDV2M2gtNWExIDEtMCAwIDAgMCAyaDV2M2gtNWExIDEtMCAwIDAgMCAyaDVsLTcgOGgzYTEgMSAwIDAgMCAwIDJsOS0xMGExIDEtMCAwIDAgMC0yaC01di0zaDVhMSAxIDAgMCAwIDAtM2gtNXYtM2g0YTEgMSAwIDAgMCAwLTJ6IiBmaWxsPSIjQTY4NjM2Ii8+PC9zdmc+";
        @endphp
    </style>
</head>
<body>

    <!-- Professional Designer Header -->
    <div class="brand-container">
        <table class="header-table">
            <tr>
                <td style="width: 120px; vertical-align: middle;">
                    @if($logoBase64)
                        <img src="{{ $logoBase64 }}" style="max-width: 110px; max-height: 80px; display: block;">
                    @endif
                </td>
                <td>
                    <div class="company-brand">{{ $companyName }}</div>
                    <div style="font-size: 8pt; color: #A68636; text-transform: uppercase; letter-spacing: 2px;">{{ $companyAddress }}</div>
                </td>
                <td class="company-contact">
                    {{ $companyEmail }}<br>
                    {{ $companyPhone }}<br>
                    {{ $companyRegNo }}
                </td>
            </tr>
        </table>
    </div>

    <!-- World Class Title -->
    <div class="doc-title-bar">
        <div class="doc-title">Acknowledgement Receipt</div>
    </div>

    <table style="font-size: 9.5pt; color: #636E72; margin-bottom: 10px;">
        <tr>
            <td>Receipt No: <strong>#{{ $receiptSerial }}</strong></td>
            <td style="text-align: right;">Date: <strong>{{ $quotationDate }}</strong></td>
        </tr>
    </table>

    <!-- Receipt Information -->
    <div class="receipt-card">
        <div class="detail-group">
            <span class="label">Received From</span>
            <span class="value serif" style="font-size: 16pt;">{{ $lead->beneficiary_name }}</span>
        </div>

        <div class="hero-amount">
            <img src="{{ $rupeeSvg }}" class="rupee-icon" style="width:22pt; height:22pt;"> {{ number_format($receiptAmount, 2) }}
        </div>

        <div class="detail-group">
            <span class="label">Sum In Words</span>
            <div style="font-style: italic; color: #636E72; font-size: 10.5pt;">
                @php
            function receiptNumberToWords($num) {
                $num = (int) $num;
                $ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
                $tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
                if ($num === 0) return 'Zero';
                $words = '';
                if ($num >= 10000000) { $words .= receiptNumberToWords((int)($num/10000000)).' Crore '; $num %= 10000000; }
                if ($num >= 100000)   { $words .= receiptNumberToWords((int)($num/100000)).' Lakh '; $num %= 100000; }
                if ($num >= 1000)     { $words .= receiptNumberToWords((int)($num/1000)).' Thousand '; $num %= 1000; }
                if ($num >= 100)      { $words .= $ones[(int)($num/100)].' Hundred '; $num %= 100; }
                if ($num >= 20)       { $words .= $tens[(int)($num/10)].' '; $num %= 10; }
                if ($num > 0)         { $words .= $ones[$num].' '; }
                return trim($words);
            }
        @endphp
        {{ receiptNumberToWords($receiptAmount) }} Rupees Only
            </div>
        </div>

        <div class="detail-group" style="border-bottom: none;">
            <span class="label">Payment Description</span>
            <span class="value" style="font-weight: normal; font-size: 10.5pt;">
                Advance partial payment towards {{ $kw }} kW Solar Power Installation as per Project Reference #{{ $quotationSerial }}.
            </span>
        </div>
    </div>

    <div style="margin-top: 40px; border-left: 3px solid #A68636; padding-left: 15px; font-size: 9pt; color: #636E72;">
        <strong>Verified Digital Document</strong><br>
        This receipt is officially issued by {{ $companyName }} via the centralized hub.<br>
        Transaction is confirmed subject to bank clearance.
    </div>

    <!-- Signature Section -->
    <div class="signature-box">
        @if($sigBase64)
            <img src="{{ $sigBase64 }}" class="signature-img">
        @else
            <div style="height: 55px;"></div>
        @endif
        <div class="sig-line">Authorized Signatory</div>
    </div>

    <div style="text-align: center; font-size: 7.5pt; color: #aaa; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
        &copy; {{ date('Y') }} {{ $companyName }} &bull; Committed to a Sustainable Future.
    </div>

</body>
</html>