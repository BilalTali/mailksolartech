<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Annexure 2 - Legal Agreement</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        body {
            font-family: "Georgia", "Times New Roman", serif;
            font-size: 11pt;
            color: #000;
            background-color: #f3f4f6;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            box-sizing: border-box;
            background-color: #fff;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        h3 {
            text-align: center;
            margin-bottom: 5px;
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
        }
        h4 {
            margin-top: 25px;
            margin-bottom: 10px;
            font-size: 12pt;
            font-weight: bold;
            text-decoration: underline;
            text-align: left;
        }
        .subtitle {
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
            font-size: 12pt;
        }
        p {
            line-height: 1.6;
            margin-bottom: 15px;
            text-align: justify;
            text-justify: inter-word;
        }
        ol {
            margin-bottom: 20px;
            padding-left: 25px;
        }
        li {
            margin-bottom: 12px;
            line-height: 1.6;
            text-align: justify;
            text-justify: inter-word;
        }
        .signature-table {
            width: 100%;
            margin-top: 50px;
            border-collapse: collapse;
        }
        .signature-table td {
            width: 50%;
            vertical-align: top;
            padding: 10px 0;
        }
        .disclaimer {
            margin-top: 40px;
            font-size: 9pt;
            text-align: justify;
            font-style: italic;
            color: #555;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
            transition: all 0.2s;
            z-index: 50;
        }
        .print-btn:hover {
            background-color: #4338ca;
            transform: translateY(-1px);
        }
        @media print {
            body {
                background-color: #fff;
                padding: 0;
            }
            .container {
                max-width: none;
                min-height: 0;
                margin: 0;
                padding: 0;
                box-shadow: none;
            }
            .no-print {
                display: none !important;
            }
            .disclaimer {
                color: #000;
                border-top: 1px solid #000;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Download PDF</button>
    <div class="container">
        <h3>Annexure 2</h3>
        <p class="subtitle">Model Draft Agreement between Consumer & Vendor for installation of grid connected rooftop solar (RTS) project under PM – Surya Ghar: Muft Bijli Yojana</p>
        
        <p>This agreement is executed on the <strong>{{ \Carbon\Carbon::parse($lead->created_at)->format('jS') }}</strong> day of <strong>{{ \Carbon\Carbon::parse($lead->created_at)->format('F, Y') }}</strong> for the design, supply, installation, commissioning, and 5-year comprehensive maintenance of a grid-connected rooftop solar (RTS) project under the PM – Surya Ghar: Muft Bijli Yojana.</p>
        
        <p><strong>BETWEEN</strong></p>
        <p>
            Name: <strong>{{ $lead->beneficiary_name }}</strong><br>
            Address: <strong>{{ $lead->beneficiary_address }}</strong><br>
            <em>(hereinafter referred to as the First Party i.e., consumer/purchaser/owner of the system)</em>
        </p>
        
        <p><strong>AND</strong></p>
        <p>
            Vendor Name: <strong>{{ $vendor->name }}</strong><br>
            Registered Office Address: <strong>{{ $vendor->registered_address }}</strong><br>
            <em>(hereinafter referred to as the Second Party i.e., Vendor/Contractor/System Integrator)</em>
        </p>
        
        <p><strong>WHEREAS</strong> the First Party desires to set up a grid-connected rooftop solar (RTS) project under the PM – Surya Ghar: Muft Bijli Yojana at their premises.</p>
        
        <p><strong>AND WHEREAS</strong> the Second Party is an empanelled vendor under the scheme and has agreed to design, supply, install, commission, and provide comprehensive maintenance for 5 years for the said RTS project, subject to the terms and conditions set forth herein.</p>
        
        <h4>FIRST PARTY OBLIGATIONS</h4>
        <ol>
            <li>The First Party shall provide access to the Second Party for site survey, installation, and commissioning of the RTS project.</li>
            <li>The First Party shall provide a shadow-free rooftop area with adequate structural strength for the installation of solar modules.</li>
            <li>The First Party shall make necessary arrangements for water and electricity required during the installation and commissioning of the system.</li>
            <li>The First Party shall be responsible for the safety and security of the materials delivered at the site until the project is commissioned and handed over.</li>
            <li>The First Party shall pay the agreed amount to the Second Party as per the payment terms mutually decided, deducting the applicable subsidy amount (if routed through the vendor).</li>
            <li>The First Party shall not tamper with the installed system and shall promptly report any defects or performance issues to the Second Party during the 5-year comprehensive maintenance period.</li>
        </ol>
        
        <h4>SECOND PARTY OBLIGATIONS</h4>
        <ol>
            <li><strong>Design and Installation:</strong> The Second Party shall design, supply, install, and commission the RTS project in compliance with the technical standards and specifications prescribed by MNRE and the respective DISCOM.</li>
            <li><strong>Quality Assurance:</strong> The Second Party shall ensure that all components used in the RTS project, including solar modules and inverters, meet the mandatory quality control standards and certifications required under the scheme.</li>
            <li><strong>Timely Completion:</strong> The Second Party shall complete the installation and commissioning within the stipulated timeframe as agreed upon with the First Party and as required by the scheme guidelines.</li>
            <li><strong>Statutory Approvals:</strong> The Second Party shall assist the First Party in obtaining all necessary statutory approvals, including net-metering connections and safety inspections from the DISCOM/CEIG.</li>
            <li><strong>Documentation:</strong> The Second Party shall provide the First Party with all necessary documentation, including user manuals, warranty certificates, and system drawings, upon successful commissioning.</li>
            <li><strong>Subsidy Processing:</strong> The Second Party shall ensure that the RTS project details are correctly uploaded on the National Portal to facilitate the seamless processing of the subsidy for the First Party.</li>
            <li><strong>Comprehensive Maintenance:</strong> The Second Party shall provide 5 years of comprehensive maintenance for the RTS project, ensuring optimal performance and rectifying any defects without additional cost to the First Party.</li>
            <li><strong>Warranty Claims:</strong> The Second Party shall facilitate any warranty claims with the original equipment manufacturers (OEMs) for the solar modules, inverters, and other covered components during the respective warranty periods.</li>
            <li><strong>Performance Guarantee:</strong> The Second Party guarantees the generation of electricity as per the estimated generation parameters specified in the initial proposal, subject to normal weather conditions.</li>
            <li><strong>Safety Standards:</strong> The Second Party shall adhere to all safety regulations and standards during the installation and maintenance of the RTS project to prevent accidents or damage to property.</li>
            <li><strong>Training:</strong> The Second Party shall provide basic training to the First Party on the operation, routine cleaning, and safe handling of the RTS project.</li>
            <li><strong>Site Cleanup:</strong> The Second Party shall ensure that the installation site is cleaned and cleared of any debris or waste material upon completion of the installation work.</li>
            <li><strong>Indemnification:</strong> The Second Party shall indemnify the First Party against any losses, damages, or legal liabilities arising from negligence or non-compliance with the scheme guidelines by the Second Party.</li>
            <li><strong>Dispute Resolution:</strong> The Second Party shall cooperate in resolving any disputes arising from this agreement amicably with the First Party, acknowledging that MNRE and DISCOMs are not parties to such disputes.</li>
            <li><strong>Non-transferability:</strong> The obligations of the Second Party under this agreement shall not be transferred or subcontracted to any third party without the prior written consent of the First Party.</li>
            <li><strong>Compliance:</strong> The Second Party shall strictly comply with all guidelines, amendments, and directives issued under the PM – Surya Ghar: Muft Bijli Yojana from time to time.</li>
        </ol>
        
        <table class="signature-table">
            <tr>
                <td>
                    <strong>First Party</strong><br><br>
                    Name: {{ $lead->beneficiary_name }}<br>
                    Address: {{ $lead->beneficiary_address }}<br><br>
                    Sign: <br>
                    @if(!empty($leadSignature))
                        <img src="{{ $leadSignature }}" style="height:60px; margin-top:10px;" alt="Lead Signature">
                    @else
                        <br><br>
                    @endif
                    <br><br>
                    Date: {{ \Carbon\Carbon::parse($lead->created_at)->format('d/m/Y') }}
                </td>
                <td>
                    <strong>Second Party</strong><br><br>
                    Name: {{ $vendor->name }}<br>
                    Address: {{ $vendor->registered_address }}<br><br>
                    Sign: <br>
                    @if(!empty($vendorSignature))
                        <img src="{{ $vendorSignature }}" style="height:60px; margin-top:10px;" alt="Vendor Signature">
                    @else
                        <br><br>
                    @endif
                    <br><br>
                    Date: {{ isset($vendor->sign_date) ? \Carbon\Carbon::parse($vendor->sign_date)->format('d/m/Y') : now()->format('d/m/Y') }}
                </td>
            </tr>
        </table>
        
        <p class="disclaimer">
            <strong>Disclaimer:</strong> This is a model draft agreement provided under the PM – Surya Ghar: Muft Bijli Yojana guidelines. MNRE and the respective DISCOMs are not parties to this private contract and bear no liability for any disputes arising out of it.
        </p>
    </div>
</body>
</html>
