<x-mail::message>
# Secure Login Request

You are receiving this email because a login request was made for your account.

Your One-Time Password (OTP) is:

<x-mail::panel>
# {{ $otp }}
</x-mail::panel>

This OTP will expire in 10 minutes. If you did not request this login, please ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
