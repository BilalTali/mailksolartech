<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Pro Forma Quotation - {{ $quotationSerial }}</title>
    <style>
        @page {
            size: A4;
            margin: 1.2cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            color: #2D3436;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }
        .serif { font-family: 'Times New Roman', Times, serif; }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .rupee-icon {
            width: 8pt;
            height: 8pt;
            vertical-align: middle;
            margin-right: -1px;
        }
        
        /* World-Class Designer Footer/Branding */
        .brand-container {
            border-bottom: 2px solid #A68636;
            padding-bottom: 10px;
            margin-bottom: 15px;
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
        .company-tagline {
            font-size: 7.5pt;
            color: #A68636;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
        }

        .header-table td { vertical-align: middle; }
        .logo { max-width: 110px; max-height: 80px; display: block; }
        .company-contact { text-align: right; font-size: 7pt; color: #636E72; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.5px; }

        .doc-title-bar {
            text-align: center;
            margin: 10px 0 15px 0;
            padding: 5px 0;
            background-color: #fcfcfc;
            border-top: 0.5px solid #eee;
            border-bottom: 0.5px solid #eee;
        }
        .doc-title {
            font-family: 'DejaVu Serif', serif;
            font-size: 13pt;
            text-transform: uppercase;
            letter-spacing: 10px;
            color: #333;
            font-weight: normal;
        }

        .section-header {
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #A68636;
            margin-bottom: 10px;
            border-bottom: 1px solid #f9f9f9;
            padding-bottom: 2px;
        }

        .items-table th {
            border-bottom: 2px solid #1a1a1a;
            text-align: left;
            padding: 10px 8px;
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 1px;
            background-color: #fafafa;
        }
        .items-table td { padding: 12px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
        
        .total-box {
            background-color: #fdfdfd;
            padding: 15px;
            border: 1px solid #eee;
            width: 260px;
            margin-left: auto;
        }
        .total-label { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .total-value { font-size: 13pt; font-weight: bold; color: #A68636; }

        .bank-details {
            margin-top: 40px;
            font-size: 8pt;
            color: #444;
            padding: 15px;
            background-color: #fcfcfc;
            border: 1px solid #f4f4f4;
        }

        .signature-box {
            text-align: center;
            width: 200px;
            margin-left: auto;
            margin-top: 30px;
        }
        .signature-img {
            max-height: 50px;
            mix-blend-mode: multiply;
            filter: contrast(1.3) brightness(1.05);
            margin-bottom: 5px;
        }
        .sig-line {
            border-top: 1.5px solid #1a1a1a;
            padding-top: 6px;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        @php
            $rupeeSvg = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI0IDhoLTQuMDNhMSAxIDAgMCAwLTEtMWg1LjAzYTEgMSAwIDAgMCAwLTJIOWExIDEtMCAwIDAgMCAyaDV2M2gtNWExIDEtMCAwIDAgMCAyaDV2M2gtNWExIDEtMCAwIDAgMCAyaDVsLTcgOGgzYTEgMSAwIDAgMCAwIDJsOS0xMGExIDEtMCAwIDAgMC0yaC01di0zaDVhMSAxIDAgMCAwIDAtM2gtNXYtM2g0YTEgMSAwIDAgMCAwLTJ6IiBmaWxsPSIjNDQ0Ii8+PC9zdmc+";
        @endphp
    </style>
</head>
<body>

    <!-- Professional Designer Header -->
    <div class="brand-container">
        <table class="header-table">
            <tr>
                <td style="width: 140px;">
                    @if($logoBase64)
                        <img src="{{ $logoBase64 }}" class="logo">
                    @endif
                </td>
                <td>
                    <div class="company-brand">{{ $companyName }}</div>
                    <div class="company-tagline">{{ $companyAffiliated }}</div>
                </td>
                <td class="company-contact">
                    Reg: {{ $companyRegNo }}<br>
                    {{ $companyAddress }}<br>
                    {{ $companyEmail }} | {{ $companyPhone }}
                </td>
            </tr>
        </table>
    </div>

    <!-- World Class Title -->
    <div class="doc-title-bar">
        <div class="doc-title">Pro Forma Quotation</div>
    </div>

    <!-- Recipient & Meta -->
    <table style="margin-bottom: 20px;">
        <tr>
            <td style="width: 60%; vertical-align: top;">
                <div class="section-header">Client Recipient</div>
                <div style="font-size: 14pt; font-weight: bold; color: #000;" class="serif">{{ $lead->beneficiary_name }}</div>
                <div style="margin-top: 6px; color: #636E72; font-size: 9.5pt;">
                    {{ $address }}<br>
                    Contact: {{ $lead->beneficiary_mobile }}<br>
                    System: <strong>{{ $kw }} kW Solar PV Power Plant</strong>
                </div>
            </td>
            <td style="width: 40%; vertical-align: top;">
                <div class="section-header" style="text-align: right;">Project Reference</div>
                <table style="font-size: 8.5pt; width: 100%;">
                    <tr><td style="color: #636E72; text-align: right;">Quote Serial:</td><td style="font-weight: bold; text-align: right; width: 60px;">#{{ $quotationSerial }}</td></tr>
                    <tr><td style="color: #636E72; text-align: right;">Date Issued:</td><td style="font-weight: bold; text-align: right;">{{ $quotationDate }}</td></tr>
                    <tr><td style="color: #636E72; text-align: right;">Valid Until:</td><td style="font-weight: bold; text-align: right;">30 Days</td></tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Items Table -->
    <div class="section-header">Technical Specifications & Investment</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Scope of Supply / Description</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: right;">Rate</th>
                <th style="width: 20%; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($billingItems as $it)
            <tr>
                <td>
                    <div style="font-weight: bold; font-size: 10.5pt; color: #1a1a1a;">{{ $it['description'] }}</div>
                    <div style="font-size: 7.5pt; color: #636E72; font-style: italic; margin-top: 2px;">Make/Brand: {{ $it['make'] ?? 'Standard' }}</div>
                </td>
                <td style="text-align: center;">01 Unit</td>
                <td style="text-align: right;"><img src="{{ $rupeeSvg }}" class="rupee-icon"> {{ number_format($it['rate'], 2) }}</td>
                <td style="text-align: right;"><img src="{{ $rupeeSvg }}" class="rupee-icon"> {{ number_format($it['rate'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Financial Summary -->
    <div style="margin-top: 30px;">
        <table>
            <tr>
                <td style="width: 50%; vertical-align: top;">
                    <div style="font-size: 8.5pt; color: #636E72; font-style: italic; border-left: 2px solid #eee; padding-left: 10px;">
                        <strong>In Words:</strong><br>
                        @php
                            function quotationNumberToWords($num) {
                                $num = (int) $num;
                                $ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
                                $tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
                                if ($num === 0) return 'Zero';
                                $words = '';
                                if ($num >= 10000000) { $words .= quotationNumberToWords((int)($num/10000000)).' Crore '; $num %= 10000000; }
                                if ($num >= 100000)   { $words .= quotationNumberToWords((int)($num/100000)).' Lakh '; $num %= 100000; }
                                if ($num >= 1000)     { $words .= quotationNumberToWords((int)($num/1000)).' Thousand '; $num %= 1000; }
                                if ($num >= 100)      { $words .= $ones[(int)($num/100)].' Hundred '; $num %= 100; }
                                if ($num >= 20)       { $words .= $tens[(int)($num/10)].' '; $num %= 10; }
                                if ($num > 0)         { $words .= $ones[$num].' '; }
                                return trim($words);
                            }
                        @endphp
                        {{ quotationNumberToWords($totalAmount) }} Rupees Only
                    </div>
                </td>
                <td style="width: 50%;">
                    <table class="total-box">
                        <tr>
                            <td style="font-size: 8pt; color: #636E72;">Taxable Base Value</td>
                            <td style="text-align: right; font-weight: bold;"><img src="{{ $rupeeSvg }}" class="rupee-icon"> {{ number_format($baseAmount, 2) }}</td>
                        </tr>
                        <tr>
                            <td style="font-size: 8pt; color: #636E72;">GST Charge ({{ $gstPercentage }}%)</td>
                            <td style="text-align: right; font-weight: bold;"><img src="{{ $rupeeSvg }}" class="rupee-icon"> {{ number_format($gstAmount, 2) }}</td>
                        </tr>
                        <tr style="height: 12px;"><td colspan="2"><div style="border-bottom: 1px solid #eee;"></div></td></tr>
                        <tr>
                            <td class="total-label">Total Investment</td>
                            <td style="text-align: right;" class="total-value"><img src="{{ $rupeeSvg }}" class="rupee-icon" style="width:10pt; height:10pt;"> {{ number_format($totalAmount, 2) }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <!-- Balanced Footer Info -->
    <div class="bank-details">
        <strong style="color: #1a1a1a; text-transform: uppercase; font-size: 7pt; letter-spacing: 1px; display: block; margin-bottom: 5px;">Bank Remittance Information</strong>
        Beneficiary: {{ $bankAccountName }} &bull; {{ $bankBranch }}<br>
        Account Number: <strong>{{ $bankAccountNumber }}</strong> &bull; IFSC: <strong>{{ $bankIfsc }}</strong>
    </div>

    <!-- Signature -->
    <div class="signature-box">
        @if($sigBase64)
            <img src="{{ $sigBase64 }}" class="signature-img">
        @else
            <div style="height: 50px;"></div>
        @endif
        <div class="sig-line">Authorized Signatory</div>
    </div>

    <div style="text-align: center; font-size: 7.5pt; color: #aaa; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
        &copy; {{ date('Y') }} {{ $companyName }} &bull; Leading with Solar. All rights reserved.
    </div>

</body>
</html>