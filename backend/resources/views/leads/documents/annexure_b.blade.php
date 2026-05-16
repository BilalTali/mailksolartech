<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Annexure B - Joint Inspection Report</title>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 794px; /* A4 width simulation */
            margin: 0 auto;
            padding: 40px;
            box-sizing: border-box;
        }
        h2, h3, h4 {
            text-align: center;
            margin: 5px 0;
            font-weight: normal;
        }
        .title {
            text-align: center;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        th {
            font-weight: normal;
        }
        .sno-col {
            width: 5%;
            text-align: center;
        }
        .particulars-col {
            width: 35%;
        }
        .detail-col {
            width: 60%;
        }
        .footer-text {
            text-align: center;
            margin: 20px 0;
            font-size: 12pt;
        }
        .signatures {
            width: 100%;
            margin-top: 50px;
            table-layout: fixed;
            border: none;
        }
        .signatures td {
            border: none;
            text-align: center;
            vertical-align: bottom;
            padding: 10px;
        }
        .sign-image {
            height: 50px;
            margin-bottom: 10px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            font-size: 14px;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            .container {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">Print / Download PDF</button>

    <div class="container">
        <div class="title">
            <h3>Annexure B</h3>
            <br>
            <h3>Kashmir Power Distribution Corporation LTD (KPDCL) Grid Connected Solar Photovoltaic</h3>
            <h3>Plant Under PM Surya Ghar: Muft Bijli Yojana Joint Inspection Report/ Project</h3>
            <h3>Completion/Commissioning Report</h3>
        </div>

        @php
            $data = $installData ?? [];
            
            // Try to find the installation date from status logs if not in JSON
            $installDate = $data['installation_date'] ?? null;
            if (!$installDate) {
                $installedLog = $lead->statusLogs->where('to_status', 'SOLAR_INSTALLED')->first();
                $installDate = $installedLog ? \Carbon\Carbon::parse($installedLog->created_at)->format('d/m/Y') : '';
            } else {
                $installDate = \Carbon\Carbon::parse($installDate)->format('d/m/Y');
            }
        @endphp

        <table>
            <thead>
                <tr>
                    <th class="sno-col">Sno</th>
                    <th class="particulars-col">Particulars</th>
                    <th class="detail-col">Detail</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="sno-col">1</td>
                    <td>Consumer CID No</td>
                    <td>{{ $data['consumer_cid'] ?? '' }}</td>
                </tr>
                <tr>
                    <td class="sno-col">2</td>
                    <td>Date of joint inspection</td>
                    <td>{{ isset($data['joint_inspection_date']) ? \Carbon\Carbon::parse($data['joint_inspection_date'])->format('d/m/Y') : '' }}</td>
                </tr>
                <tr>
                    <td class="sno-col">3</td>
                    <td>Date of Installation</td>
                    <td>{{ $installDate }}</td>
                </tr>
                <tr>
                    <td class="sno-col">4</td>
                    <td><strong>Registration Number (Application Number)</strong></td>
                    <td><strong>{{ $lead->govt_application_number ?? $lead->ulid }}</strong></td>
                </tr>
                <tr>
                    <td class="sno-col">5</td>
                    <td>Name of the Beneficiary</td>
                    <td>{{ $lead->beneficiary_name }}</td>
                </tr>
                <tr>
                    <td class="sno-col">6</td>
                    <td>Address of Installation with Pin Code</td>
                    <td>{{ $lead->beneficiary_address }}{{ $lead->beneficiary_pincode ? ' - ' . $lead->beneficiary_pincode : '' }}</td>
                </tr>
                <tr>
                    <td class="sno-col">7</td>
                    <td>Elect city consumer number</td>
                    <td>{{ $lead->consumer_number }}</td>
                </tr>
                <tr>
                    <td class="sno-col">8</td>
                    <td>Solar PV Module</td>
                    <td>
                        Make, Model, Rating, & Serial Nos as per DCR certificate attached, Geo Tagged Photos and Material undertaking submitted by vendor to SDO.<strong>{{ $vendor->name ?? 'VENDOR' }}</strong> DCR certificate serial number validity checked<br><br>
                        Make: {{ $data['solar_module_make'] ?? '' }}<br>
                        S.No: {{ $data['solar_module_sno'] ?? '' }}
                    </td>
                </tr>
                <tr>
                    <td class="sno-col">9</td>
                    <td>Solar Inverter</td>
                    <td>
                        Nominal output power: {{ $data['inverter_rating'] ?? '' }}<br>
                        Make: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $data['inverter_make'] ?? '' }}<br>
                        S.No.: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $data['inverter_sno'] ?? '' }}<br>
                        Inverter is BIS Certified
                    </td>
                </tr>
                <tr>
                    <td class="sno-col">10</td>
                    <td>Remote Monitoring via App configured (yes/no)</td>
                    <td>{{ $data['remote_monitoring_configured'] ?? '' }}</td>
                </tr>
                <tr>
                    <td class="sno-col">11</td>
                    <td>DCDB with SPD (mention fuse/MCB rating)</td>
                    <td>
                        Rating: {{ $data['dcdb_rating'] ?? '' }}<br>
                        Fuse/MCB rating is as per requirement
                    </td>
                </tr>
                <tr>
                    <td class="sno-col">12</td>
                    <td>ACDB with SPD (mention MCB rating)</td>
                    <td>
                        Rating: {{ $data['acdb_rating'] ?? '' }}<br>
                        Fuse/ MCB rating is as per requirement
                    </td>
                </tr>
                <tr>
                    <td class="sno-col">13</td>
                    <td>DC Wire type and Size</td>
                    <td>
                        Type: {{ $data['dc_wire_type'] ?? '' }} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Size: {{ $data['dc_wire_size'] ?? '' }}<br>
                        Type and size of DC wire is as per requirement
                    </td>
                </tr>
                <tr>
                    <td class="sno-col">14</td>
                    <td>AC Wire type and Size</td>
                    <td>
                        Type: {{ $data['ac_wire_type'] ?? '' }} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Size: {{ $data['ac_wire_size'] ?? '' }}<br>
                        Type and size of AC wire is as per requirement
                    </td>
                </tr>
                <tr>
                    <td class="sno-col">15</td>
                    <td>Earth wire type and size</td>
                    <td>
                        Type: {{ $data['earth_wire_type'] ?? '' }} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Size: {{ $data['earth_wire_size'] ?? '' }}<br>
                        Type and size of earth wire is as per requirement
                    </td>
                </tr>
                <tr>
                    <td class="sno-col">15</td>
                    <td>Lightening protection</td>
                    <td>Rod type LA with insulated hard plastic base and minimum three spikes provided on the roof. GEO photo checked. 6 sq.mm sire in separate conduit to earth electrode tightened by clamp bolt checked.</td>
                </tr>
                <tr>
                    <td class="sno-col">16</td>
                    <td>Earthing protection</td>
                    <td>AC & DC Earthing checked. Tightened by clamp-bolt arrangement. Geo tag photo of earth electrode checked.</td>
                </tr>
                <tr>
                    <td class="sno-col">17</td>
                    <td>REMARKS ( BY SDO):</td>
                    <td>{{ $data['sdo_remarks'] ?? '' }}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer-text">
            Certified that a Grid Connected Solar PV Power Plant has been installed with above details.<br><br>
            Uploaded documents checked on portal. The material undertaking by vendor is also enclosed.<br>
            Relevant DCR/BIS certificates checked. The RTS system is working satisfactory.
        </div>

        <table class="signatures">
            <tr>
                <td>
                    Consumer<br><br><br>
                    @if(!empty($leadSignature))
                        <img src="{{ $leadSignature }}" class="sign-image" alt="Consumer Sign"><br>
                    @else
                        <br><br><br>
                    @endif
                    Name sign
                </td>
                <td>
                    Vendor<br><br><br>
                    @if(!empty($vendorSignature))
                        <img src="{{ $vendorSignature }}" class="sign-image" alt="Vendor Sign"><br>
                    @else
                        <br><br><br>
                    @endif
                    Name sign & Stamp
                </td>
                <td>
                    DISCOM<br><br><br>
                    <br><br><br>
                    Name ,sign & stamp
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
