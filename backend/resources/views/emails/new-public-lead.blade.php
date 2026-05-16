<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        h2 { color: #f97316; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
        th { width: 40%; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>New Solar Application Received</h2>
        <p>A new public lead has just been submitted via the AndleebSurya website portal.</p>
        
        <table>
            <tr>
                <th>Reference ID</th>
                <td><strong>{{ $lead->ulid }}</strong></td>
            </tr>
            <tr>
                <th>Name</th>
                <td>{{ $lead->beneficiary_name }}</td>
            </tr>
            <tr>
                <th>Mobile</th>
                <td>{{ $lead->beneficiary_mobile }}</td>
            </tr>
            <tr>
                <th>District</th>
                <td>{{ $lead->beneficiary_district ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Sub-Division</th>
                <td>{{ $lead->sub_division_name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Average Bill</th>
                <td>₹ {{ $lead->average_monthly_bill ?? 'N/A' }}</td>
            </tr>
        </table>
        
        <p style="margin-top: 30px;">
            Please login to the Admin dashboard to review this lead and assign an agent.
        </p>
    </div>
</body>
</html>
