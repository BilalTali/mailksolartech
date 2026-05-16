<x-mail::message>
# Password Reset Request

Hi {{ $userName ?: 'there' }},

We received a request to reset the password for your account.

Your One-Time Password (OTP) for password reset is:

<x-mail::panel>
# {{ $otp }}
</x-mail::panel>

This OTP will expire in **10 minutes**. If you did not request a password reset, please ignore this email — your password will remain unchanged.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
